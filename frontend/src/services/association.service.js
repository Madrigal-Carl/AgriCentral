import api from "@/api/axios";

export async function getAssociations(params) {
    const response = await api.get("/associations", { params });
    return response.data;
}

export async function createAssociation(data) {
    const response = await api.post("/associations", data);
    return response.data;
}

export async function updateAssociation(id, data) {
    const response = await api.patch(`/associations/${id}`, data);
    return response.data;
}

export async function deleteAssociation(id) {
    const response = await api.delete(`/associations/${id}`);
    return response.data;
}