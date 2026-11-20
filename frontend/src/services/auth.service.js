import api from "@/api/axios";

export async function registerUser(data) {
    const response = await api.post("/auth/register", data);

    return response.data;
}

export async function loginUser(data) {
    const response = await api.post("/auth/login", data);

    return response.data;
}

export async function logoutUser() {
    const response = await api.post("/auth/logout");

    return response.data;
}

export async function getMe() {
    const response = await api.get("/auth/me");

    return response.data;
}

export async function requestPasswordReset(data) {
    const response = await api.post("/auth/forgot-password", data);

    return response.data;
}

export async function verifyPasswordResetOtp(data) {
    const response = await api.post("/auth/verify-otp", data);

    return response.data;
}

export async function resetPassword(data) {
    const response = await api.post("/auth/reset-password", data);

    return response.data;
}
