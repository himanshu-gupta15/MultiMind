import api from "../../utils/axios.js";

export const getConversation = async () => {
    try {
        const { data } = await api.get("/api/chat/get-conversations");
        return data || [];
    } catch (error) {
        console.error("Error getting conversation:", error);
        return [];
    }
};