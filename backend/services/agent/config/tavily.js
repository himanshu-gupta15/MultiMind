import { TavilySearch } from "@langchain/tavily";

export const searchTool = new TavilySearch({
    maxResults: 5,
    topic: "general",
    includeImages: true,
    tavilyApiKey: process.env.TAVILY_API_KEY || process.env.TRAVILY_API_KEY || "dummy_key"
});