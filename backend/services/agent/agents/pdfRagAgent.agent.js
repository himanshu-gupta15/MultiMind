import fs from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { getModel } from "../config/llmModels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

const extractPdfText = async (buffer) => {
    // 1. Try ESM class PDFParse from pdf-parse (v2+)
    try {
        const { PDFParse } = await import("pdf-parse");
        if (PDFParse) {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            if (typeof parser.destroy === "function") {
                await parser.destroy();
            }
            if (result?.text) return result.text;
        }
    } catch (e) {
        console.warn("PDFParse v2 extraction notice:", e?.message);
    }

    // 2. Try default function export from pdf-parse (v1)
    try {
        const pdfModule = await import("pdf-parse");
        const parseFn = pdfModule.default || pdfModule;
        if (typeof parseFn === "function") {
            const result = await parseFn(buffer);
            if (result?.text) return result.text;
        }
    } catch (e) {
        console.warn("pdf-parse default function extraction notice:", e?.message);
    }

    throw new Error("Could not extract text from the uploaded PDF.");
};

export const pdfRagAgent = async (state) => {
    await checkAgentLimit(state.userId, "pdf");
    try {
        if (!state.file || !state.file.path) {
            return {
                ...state,
                aiResponse: "No PDF file was provided. Please upload a PDF file to analyze."
            };
        }

        const buffer = fs.readFileSync(state.file.path);
        const text = await extractPdfText(buffer);

        if (!text || !text.trim()) {
            return {
                ...state,
                aiResponse: "The uploaded PDF appears to be empty or contains only scanned images without selectable text."
            };
        }

        let context = "";

        // Try Vector store similarity search if Google API key / Qdrant is available
        try {
            if (process.env.GOOGLE_API_KEY) {
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,
                    chunkOverlap: 200
                });
                const docs = await splitter.createDocuments([text]);
                const collectionName = `pdf-${Date.now()}`;
                const store = await vectorStore(docs, collectionName);
                const relevantDocs = await store.similaritySearch(state.prompt || "summarize document", 5);
                context = relevantDocs.map(d => d.pageContent).join("\n\n");
            }
        } catch (vecErr) {
            console.warn("Vector store query failed, falling back to direct context:", vecErr?.message);
        }

        // Direct context fallback (safely truncated to ~25k characters to fit within context window)
        if (!context || !context.trim()) {
            context = text.slice(0, 25000);
        }

        const llm = await getModel("pdf-rag");

        const messages = [
            new SystemMessage(`You are MultiMind PDF Assistant.

Rules:
- Answer accurately based ONLY on the provided PDF context.
- If the answer is not present in the PDF context, reply: "I couldn't find this information in the uploaded PDF."
- Format your response using clean Markdown with clear headings and bullet points where helpful.
`),
            new HumanMessage(`PDF Context:
${context}

User Question:
${state.prompt || "Please summarize this document."}`)
        ];

        const response = await llm.invoke(messages);
        await deductCredits(state.userId, "pdf");

        return {
            ...state,
            aiResponse: response?.content || "No response received."
        };

    } catch (error) {
        console.error("PDF RAG Agent Error:", error);
        return {
            ...state,
            aiResponse: error?.data?.message || `Failed to process PDF: ${error.message || error}`
        };
    } finally {
        if (state.file && state.file.path && fs.existsSync(state.file.path)) {
            try {
                fs.unlinkSync(state.file.path);
            } catch (err) {
                console.error("Failed to delete temp file:", err);
            }
        }
    }
};
