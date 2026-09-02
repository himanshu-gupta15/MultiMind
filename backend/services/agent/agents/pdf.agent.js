import { checkAgentLimit } from "../config/agentLimit.js";
import { deductCredits } from "../utils/deductCredits.js";
import { getModel } from "../config/llmModels.js";
import { generatePdf } from "../utils/generatePdf.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

export const pdfAgent = async (state) => {
    await checkAgentLimit(state.userId, "pdf");
    try {
        const llm = await getModel("pdf");
        const prompt = `You are an expert document writer.

Return ONLY valid JSON matching this structure:
{
  "title": "Document Title",
  "subtitle": "Document Subtitle or Short Summary",
  "sections": [
    {
      "heading": "Section Heading",
      "points": [
        "First key point...",
        "Second key point...",
        "Third key point..."
      ]
    }
  ]
}

Rules:
- Generate 4-8 comprehensive sections.
- Each section must have 3-6 clear, informative bullet points.
- Output ONLY valid JSON starting with { and ending with }.
- Do NOT include any markdown code blocks, backticks (\`\`\`), or commentary.

Topic / User Request:
${state.prompt}
`;

        const res = await llm.invoke(prompt);
        const raw = (res?.content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const data = JSON.parse(raw);
        await deductCredits(state.userId, "pdf");

        const buffer = await generatePdf(data);
        let downloadUrl = "";

        // Try S3 upload if configured
        try {
            if (process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
                const filename = `pdf/${Date.now()}.pdf`;
                await uploadToS3(filename, buffer, "application/pdf");
                downloadUrl = await getFromS3(filename, 24 * 60 * 60);
            }
        } catch (s3Error) {
            console.warn("S3 upload unavailable or failed, falling back to data URL:", s3Error?.message);
        }

        // Fallback to base64 Data URL so PDF generation works offline / without S3
        if (!downloadUrl) {
            const base64 = buffer.toString("base64");
            downloadUrl = `data:application/pdf;base64,${base64}`;
        }

        return {
            ...state,
            aiResponse: `Document Generated Successfully.\n\n### 📄 ${data.title}\n${data.subtitle ? `*${data.subtitle}*\n\n` : ""}[Click Here to Download / View PDF](${downloadUrl})`
        };
    } catch (error) {
        console.error("PDF Agent Error:", error);
        return {
            ...state,
            aiResponse: error?.data?.message || `Failed to generate PDF: ${error.message || error}`
        };
    }
};