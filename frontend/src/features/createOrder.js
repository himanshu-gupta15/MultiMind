import api from "../../utils/axios.js";

export const createOrder = async (payload) => {
    try {
        const { data } = await api.post("/api/billing/create", payload);
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};
