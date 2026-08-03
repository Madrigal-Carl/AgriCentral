import api from "@/api/axios";

export async function getAnalytics(params) {
    const response = await api.get("/analytics", { params });
    return response.data;
}