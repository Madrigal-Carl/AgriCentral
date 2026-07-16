import api from "@/api/axios";

export async function getEquipments(params) {
    const response = await api.get("/equipments", { params });
    return response.data;
}

export async function createEquipment(data) {
    const response = await api.post("/equipments", data);
    return response.data;
}

export async function updateEquipment(id, data) {
    const response = await api.patch(`/equipments/${id}`, data);
    return response.data;
}

export async function deleteEquipment(id) {
    const response = await api.delete(`/equipments/${id}`);
    return response.data;
}

export async function getAvailableEquipments() {
    const response = await api.get("/equipments/available");
    return response.data;
}