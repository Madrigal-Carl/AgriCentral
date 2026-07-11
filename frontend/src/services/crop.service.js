import api from "@/api/axios";

export async function getCrops(params) {
    const response = await api.get("/crops", { params });
    return response.data;
}

export async function createCrop(data) {
    const response = await api.post("/crops", data);
    return response.data;
}

export async function updateCrop(id, data) {
    const response = await api.patch(`/crops/${id}`, data);
    return response.data;
}

export async function deleteCrop(id) {
    const response = await api.delete(`/crops/${id}`);
    return response.data;
}