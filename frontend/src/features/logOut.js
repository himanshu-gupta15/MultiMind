import api from "../../utils/axios.js";

async function logOut() {
    try {
        const { data } = await api.get("/api/auth/logout");
        localStorage.removeItem("session_id");
        return data;
    } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("session_id");
    }
}

export default logOut;