import api from "@/api/axios";

export async function createFarmer(data) {
    const response = await api.post("/farmers", data);

    return response.data;
}