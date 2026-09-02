import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getMemory } from "../config/memory.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

export const chatAgent = async (state) => {
    try {
        const llm = await getModel("chat");
        const history = await getMemory(state.conversationId);
        
        const now = new Date();
        const currentDateStr = now.toLocaleDateString("en-US", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
        });

        const hasSearchResults = state.searchResults && (
            (Array.isArray(state.searchResults) && state.searchResults.length > 0) ||
            (typeof state.searchResults === "object" && Object.keys(state.searchResults).length > 0)
        );

        const searchContext = hasSearchResults ? `
Web Search Results:
${JSON.stringify(state.searchResults, null, 2)}

Incorporate the above web search results naturally to answer the user.` : "";

        const systemPrompt = `You are MultiMind, an intelligent AI assistant.
Current Date: ${currentDateStr} (Time UTC: ${now.toUTCString()})
${searchContext}

Formatting:
- Use # for titles and ## for sections.
- Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- If asked about today's date, day, or current time, refer to the Current Date provided above.
`;

        const messages = [
            new SystemMessage(systemPrompt)
        ];

        history.forEach(msg => {
            if (msg.role === "user") {
                messages.push(new HumanMessage(msg.content));
            } else {
                messages.push(new AIMessage(msg.content));
            }
        });

        messages.push(new HumanMessage(state.prompt));

        const response = await llm.invoke(messages);
        await deductCredits(state.userId, "chat");

        return {
            ...state,
            aiResponse: response.content
        };
    } catch (error) {
        console.error("chatAgent error:", error?.message || error);
        return {
            ...state,
            aiResponse: error?.message || "Failed to generate response.."
        };
    }
};