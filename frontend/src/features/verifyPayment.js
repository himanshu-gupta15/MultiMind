import api from "../../utils/axios.js";

export const verifyPayment = async (payload) => {
    try {
        const { data } = await api.post("/api/billing/verify", payload);
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};
