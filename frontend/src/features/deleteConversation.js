import api from "../../utils/axios.js";

export const deleteConversation = async (id) => {
    try {
        const { data } = await api.delete(`/api/chat/delete/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting conversation:", error);
        throw error;
    }
};

export default deleteConversation;
