import api from "@/api/axios";

export async function getLookups() {
  const response = await api.get("/lookups");
  return response.data.lookups;
}

export async function getMaintenance(type, params) {
  const response = await api.get(`/maintenance/${type}`, { params });
  return response.data;
}

export async function getMaintenanceUsage(type, id) {
  const response = await api.get(`/maintenance/${type}/${id}/usage`);
  return response.data;
}

export async function mutateMaintenance(type, { action, id, ...data }) {
  const url = `/maintenance/${type}${id ? `/${id}` : ""}`;
  const response = action === "archive" ? await api.delete(url)
    : action === "restore" ? await api.patch(`${url}/restore`)
      : id ? await api.patch(url, data) : await api.post(url, data);
  return response.data;
}
