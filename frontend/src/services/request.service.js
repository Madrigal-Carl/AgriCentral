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

// data: { attachments: [{ url, publicId, resourceType }] } (at least one image).
export async function releaseRequest(id, data) {
    const response = await api.patch(`/requests/${id}/release`, data);
    return response.data;
}

export async function deleteRequest(id) {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
}

export async function revertRequestApproval(id, data) {
  const response = await api.patch(`/requests/${id}/approval/revert`, data);
  return response.data;
}
