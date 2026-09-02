import axios from "axios";

export const getMessages = async (conversation_id) => {
    try {
        const { data } = await axios.get(`${process.env.CHAT_SERVICE_URL}/get-messages/${conversation_id}`);
        return data;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
};