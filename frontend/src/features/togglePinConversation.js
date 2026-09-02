import api from "../../utils/axios.js";

export const togglePinConversation = async (id) => {
    try {
        const { data } = await api.post(`/api/chat/toggle-pin/${id}`);
        return data;
    } catch (error) {
        console.error("Error pinning conversation:", error);
        throw error;
    }
};

export default togglePinConversation;
