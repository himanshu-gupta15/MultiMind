import { StateGraph } from "@langchain/langgraph";
import { agentState } from "./state.js";
import { router } from "./router.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { visionAgent } from "../agents/vision.agent.js";
import { chatAgent } from "../agents/chat.agent.js";
import { pdfRagAgent } from "../agents/pdfRagAgent.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.agent.js";

const workflow = new StateGraph(agentState);

workflow.addNode("router", router);
workflow.addNode("chat", chatAgent);
workflow.addNode("pdf", pdfAgent);
workflow.addNode("ppt", pptAgent);
workflow.addNode("search", searchAgent);
workflow.addNode("coding", codingAgent);
workflow.addNode("vision", visionAgent);
workflow.addNode("pdfRag", pdfRagAgent);
workflow.addNode("imageAnalyzer", imageAnalyzer);

workflow.addEdge("__start__", "router");
workflow.addConditionalEdges("router", (state) => {
    switch (state.agent) {
        case "chat":
            return "chat";
        case "pdf":
            return "pdf";
        case "ppt":
            return "ppt";
        case "search":
            return "search";
        case "coding":
            return "coding";
        case "vision":
            return "vision";
        case "pdfRag":
            return "pdfRag";
        case "imageAnalyzer":
            return "imageAnalyzer";
        default:
            return "chat";
    }
}, {
    chat: "chat",
    search: "search",
    pdf: "pdf",
    ppt: "ppt",
    coding: "coding",
    vision: "vision",
    pdfRag: "pdfRag",
    imageAnalyzer: "imageAnalyzer"
});

workflow.addEdge("search", "chat");
workflow.addEdge("chat", "__end__");
workflow.addEdge("coding", "__end__");
workflow.addEdge("pdf", "__end__");
workflow.addEdge("ppt", "__end__");
workflow.addEdge("vision", "__end__");
workflow.addEdge("pdfRag", "__end__");
workflow.addEdge("imageAnalyzer", "__end__");

const app = workflow.compile();
export default app;