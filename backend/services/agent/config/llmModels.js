import { ChatGroq } from "@langchain/groq";
import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let groqInstance = null;
let geminiInstance = null;
let openrouterInstance = null;

const getOpenRouter = () => {
    if (!openrouterInstance) {
        openrouterInstance = new ChatOpenRouter({
            model: "deepseek/deepseek-chat",
            temperature: 0,
            maxTokens: 2500,
            apiKey: process.env.OPENROUTER_API_KEY || "dummy_key"
        });
    }
    return openrouterInstance;
};

const getGroq = () => {
    if (!process.env.GROQ_API_KEY) {
        return getGemini();
    }
    if (!groqInstance) {
        groqInstance = new ChatGroq({
            model: "openai/gpt-oss-120b",
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groqInstance;
};

const getGemini = () => {
    if (!process.env.GOOGLE_API_KEY) {
        return getGroq();
    }
    if (!geminiInstance) {
        geminiInstance = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GOOGLE_API_KEY
        });
    }
    return geminiInstance;
};

export const getModel = async (agent) => {
    switch (agent) {
        case "router":
            return getGemini();
        case "intent":
            return getGemini();
        case "chat":
            return getGroq();
        case "search":
            return getGroq();
        case "coding":
            return getGemini();
        case "imageAnalyzer":
            return getGemini();
        case "pdf":
            return getGemini();
        case "ppt":
            return getGemini();
        case "pdf-rag":
            return getGemini();
        case "image":
            return getGemini();
        default:
            return getGemini();
    }
};