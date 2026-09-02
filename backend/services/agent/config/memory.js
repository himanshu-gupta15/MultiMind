import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

export const getMemory = async (conversationId) => {
    const key = `messages-${conversationId}`;
    const cached = await redis.get(key); 
    if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
    }

    const messages = await getMessages(conversationId);
    const safeMessages = messages || [];
    await redis.set(key, JSON.stringify(safeMessages), "EX", 60 * 60 * 24); // 1 day expiration
    return safeMessages;
};

export const addMessage = async (conversationId, role, content) => {
    const key = `messages-${conversationId}`;
    const cached = await redis.get(key); 
    let messages = [];
    if (cached) {
        messages = JSON.parse(cached);
    }

    messages.push({
        role,
        content
    });
    
    if (messages.length > 20) {
        messages.shift();
    }
    await redis.set(key, JSON.stringify(messages), "EX", 60 * 60 * 24); // 1 day expiration
};