import { getModel } from "../config/llmModels.js";

const isCodingPrompt = (prompt = "") => {
    const text = prompt.toLowerCase();
    return [
        "build",
        "create",
        "make",
        "develop",
        "code",
        "app",
        "website",
        "project",
        "component",
        "ui",
        "frontend",
        "backend",
        "api",
        "debug",
        "fix",
        "react",
        "next",
        "vue",
        "javascript",
        "typescript",
        "html",
        "css"
    ].some(keyword => text.includes(keyword));
};

const isSearchPrompt = (prompt = "") => {
    const text = prompt.toLowerCase();
    return ["latest", "current", "news", "recent", "today", "search", "find", "lookup", "internet"].some(keyword => text.includes(keyword));
};

const isDocumentPrompt = (prompt = "") => {
    const text = prompt.toLowerCase();
    return ["pdf", "document", "ppt", "presentation", "slides"].some(keyword => text.includes(keyword));
};

export const router = async (state) => {
    if (state.file) {
        if (state.file.mimetype === "application/pdf") {
            return {
                ...state,
                agent: "pdfRag"
            };
        }
        if (state.file.mimetype.startsWith("image/")) {
            return {
                ...state,
                agent: "imageAnalyzer"
            };
        }
    }

    if (!state.agent || state.agent === "auto") {
        if (isDocumentPrompt(state.prompt)) {
            if (state.prompt.toLowerCase().includes("ppt") || state.prompt.toLowerCase().includes("presentation") || state.prompt.toLowerCase().includes("slides")) {
                return { ...state, agent: "ppt" };
            }
            return { ...state, agent: "pdf" };
        }

        if (isSearchPrompt(state.prompt) && !isCodingPrompt(state.prompt)) {
            return { ...state, agent: "search" };
        }

        if (isCodingPrompt(state.prompt)) {
            return { ...state, agent: "coding" };
        }
    }

    if (state.agent && state.agent !== "auto") {
        return {
            ...state,
            agent: state.agent
        };
    }

    const llm = await getModel("router");
    const prompt = `You are an agent router. 
    Available agents:
    - chat 
    - search 
    - coding 
    - pdf 
    - ppt
    - vision 

    Rules:
    chat:
    General conversation,
    explanations,
    learning,
    questions.

    search:
    Current events,
    latest information,
    news,
    recent developments,
    internet lookup.

    coding:
    Generate code,
    debug code,
    build projects,
    architecture,
    API design.

    pdf:
    Questions about generate PDFs 
    or document context.
    

    ppt:
    Questions about generate PPTs 
    or ppt context.
    

    vision:
    Generate image,
    create image    
    

    Return ONLY one word:

    chat 
    search 
    coding 
    pdf
    ppt 
    vision

    User Query:
    ${state.prompt}
    `;

    const response = await llm.invoke(prompt);

    return {
        ...state,
        agent: response.content.trim().toLowerCase()
    };
};