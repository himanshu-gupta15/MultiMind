import api from "../../utils/axios.js";

async function sendMessage(payload) {
    try {
        const { data } = await api.post("/api/agent/chat", payload);
        return data;
    } catch (error) {
        console.error("Error sending message:", error);
        return null;
    }
}

export default sendMessage;