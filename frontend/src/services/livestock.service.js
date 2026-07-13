import api from "@/api/axios";

export async function getLivestocks(params) {
    const response = await api.get("/livestocks", { params });
    return response.data;
}

export async function createLivestock(data) {
    const response = await api.post("/livestocks", data);
    return response.data;
}

export async function updateLivestock(id, data) {
    const response = await api.patch(`/livestocks/${id}`, data);
    return response.data;
}

export async function deleteLivestock(id) {
    const response = await api.delete(`/livestocks/${id}`);
    return response.data;
}