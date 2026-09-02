import api from "../../utils/axios.js";

export const createConversation = async (title) => {
    try {
        const { data } = await api.post("/api/chat/conversations", { title });
        return data;
    } catch (error) {
        console.error("Error creating conversation:", error);
        return null;
    }
};