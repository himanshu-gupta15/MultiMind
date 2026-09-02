import axios from 'axios' 

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const sessionId = localStorage.getItem("session_id");
    if (sessionId) {
        config.headers.Authorization = `Bearer ${sessionId}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;