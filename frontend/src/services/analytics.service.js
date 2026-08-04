import api from "@/api/axios";

export async function getAnalytics(params) {
    const response = await api.get("/analytics", { params });
    return response.data;
}

export async function getOverview(params) {
    const response = await api.get("/analytics/overview", { params });
    return response.data;
}

export async function exportAnalyticsPdf(params) {
    const response = await api.get("/analytics/export-pdf", {
        params,
        responseType: "blob",
    });
    return response.data;
}