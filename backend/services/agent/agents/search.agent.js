import { checkAgentLimit } from "../config/agentLimit.js";
import { searchTool } from "../config/tavily.js";
import { deductCredits } from "../utils/deductCredits.js";
import axios from "axios";

// Free DuckDuckGo search fallback if Tavily is unavailable or returns 401
const fallbackSearch = async (query) => {
    try {
        const res = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            },
            timeout: 8000
        });
        const html = res.data || "";
        const snippets = [];
        const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
            const text = match[1].replace(/<[^>]+>/g, "").trim();
            if (text) snippets.push(text);
        }

        return snippets.map((snippet, i) => ({
            title: `Web Result ${i + 1}`,
            content: snippet
        }));
    } catch (err) {
        console.warn("Fallback search notice:", err?.message);
        return [];
    }
};

export const searchAgent = async (state) => {
    await checkAgentLimit(state.userId, "search");
    try {
        let results = null;
        let images = [];

        // 1. Try Tavily search if configured
        const tavilyKey = process.env.TAVILY_API_KEY || process.env.TRAVILY_API_KEY;
        if (tavilyKey && tavilyKey !== "dummy_key") {
            try {
                const res = await searchTool.invoke({ query: state.prompt });
                if (res) {
                    results = res;
                    images = res.images || [];
                }
            } catch (tavilyErr) {
                console.warn("Tavily search notice (using fallback):", tavilyErr?.message);
            }
        }

        // 2. Fallback if Tavily search was unavailable or errored
        if (!results || (Array.isArray(results) && results.length === 0)) {
            const fallbackResults = await fallbackSearch(state.prompt);
            if (fallbackResults && fallbackResults.length > 0) {
                results = fallbackResults;
            }
        }

        await deductCredits(state.userId, "search");
        return {
            ...state,
            searchResults: results || [],
            images: images
        };
    } catch (error) {
        console.error("searchAgent error:", error?.message || error);
        return {
            ...state,
            searchResults: [],
            images: [],
            aiResponse: error?.message || "Failed to search.."
        };
    }
};