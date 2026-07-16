import api from "@/api/axios";

export async function getRequests(params) {
    const response = await api.get("/requests", { params });
    return response.data;
}

export async function createRequest(data) {
    const response = await api.post("/requests", data);
    return response.data;
}

export async function updateRequest(id, data) {
    const response = await api.patch(`/requests/${id}`, data);
    return response.data;
}

export async function updateRequestApproval(id, data) {
    const response = await api.patch(`/requests/${id}/approval`, data);
    return response.data;
}

export async function releaseRequest(id) {
    const response = await api.patch(`/requests/${id}/release`);
    return response.data;
}

export async function deleteRequest(id) {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
}