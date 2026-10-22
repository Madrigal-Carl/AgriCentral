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

export async function getAvailableLivestocks() {
    const response = await api.get("/livestocks/available");
    return response.data;
}

export async function getLivestock(id) {
    const response = await api.get(`/livestocks/${id}`);
    return response.data;
}

export async function getLivestockMothers(params) {
    const response = await api.get("/livestocks/mothers", { params });
    return response.data;
}
