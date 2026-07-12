import api from "@/api/axios";

export async function getFarms(params) {
    const response = await api.get("/farms", { params });
    return response.data;
}

export async function createFarm(data) {
    const response = await api.post("/farms", data);
    return response.data;
}

export async function updateFarm(id, data) {
    const response = await api.patch(`/farms/${id}`, data);
    return response.data;
}

export async function deleteFarm(id) {
    const response = await api.delete(`/farms/${id}`);
    return response.data;
}