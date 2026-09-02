import api from "../../utils/axios.js";

export const getConversationById = async (id) => {
    try {
        const { data } = await api.get(`/api/chat/get-conversation/${id}`);
        return data;
    } catch (error) {
        console.error("Error getting conversation by id:", error);
        return null;
    }
};

export default getConversationById;
