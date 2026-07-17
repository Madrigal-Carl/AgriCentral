import api from "@/api/axios";

export async function getReports(params) {
    const response = await api.get("/reports", { params });
    return response.data;
}

export async function createReport(data) {
    const response = await api.post("/reports", data);
    return response.data;
}

export async function updateReport(id, data) {
    const response = await api.patch(`/reports/${id}`, data);
    return response.data;
}

export async function updateReportApproval(id, data) {
    const response = await api.patch(`/reports/${id}/approval`, data);
    return response.data;
}

export async function deleteReport(id) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
}