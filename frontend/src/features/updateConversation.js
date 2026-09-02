import api from "../../utils/axios.js";

export const updateConversation = async ({ id, title }) => {
    try {
        const { data } = await api.post("/api/chat/update-conversation", { id, title });
        return data;
    } catch (error) {
        console.error("Error updating conversation:", error);
        throw error;
    }
};