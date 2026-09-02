import redis from "../../../shared/redis/redis.js";
import { addMessage } from "../config/memory.js";
import axios from "axios";
import Graph from "../graph/graph.js";

const AGENT_TIMEOUT_MS = 60000;

const runWithTimeout = (promise, timeoutMs, timeoutMessage) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(timeoutMessage);
            error.status = 504;
            reject(error);
        }, timeoutMs);
    });

    return Promise.race([
        promise.finally(() => clearTimeout(timeoutId)),
        timeoutPromise
    ]);
};

export const agent = async (req, res, next) => {
    try {
        const { prompt, conversationId, agent: selectedAgent } = req.body;
        const file = req.file;
        const userId = req.headers["x-user-id"];

        if (!prompt || !conversationId) {
            return res.status(400).json({ message: "prompt and conversationId are required" });
        }

        await redis.del(`messages-${conversationId}`);
        await axios.post(`${process.env.CHAT_SERVICE_URL}/save-message`, {
            conversationId,
            role: "user",
            content: prompt
        });

        const result = await runWithTimeout(
            Graph.invoke({
                prompt,
                conversationId,
                agent: selectedAgent,
                userId,
                file
            }),
            AGENT_TIMEOUT_MS,
            "Agent response timed out. Please try again."
        );

        const response = result.aiResponse;
        addMessage(conversationId, "user", prompt);
        await addMessage(conversationId, "assistant", response);

        await axios.post(`${process.env.CHAT_SERVICE_URL}/save-message`, {
            conversationId,
            role: "assistant",
            content: result?.aiResponse,
            images: result?.images,
            artifacts: result?.artifacts
        });

        return res.status(200).json({
            answer: result.aiResponse,
            images: result.images,
            artifacts: result.artifacts
        });

    } catch (error) {
        next(error);
    }
};