import api from "@/api/axios";

export async function getFarmers(params) {
    const response = await api.get("/farmers", { params });
    return response.data;
}

export async function getFarmersByAssociationId(associationId) {
    const response = await api.get(`/farmers/${associationId}`);
    return response.data;
}

export async function getCropsByFarmerId(farmerId) {
    const response = await api.get(`/farmers/${farmerId}/crops`);
    return response.data;
}

export async function createFarmer(data) {
    const response = await api.post("/farmers", data);
    return response.data;
}

export async function updateFarmer(id, data) {
    const response = await api.patch(`/farmers/${id}`, data);
    return response.data;
}

export async function deleteFarmer(id) {
    const response = await api.delete(`/farmers/${id}`);
    return response.data;
}