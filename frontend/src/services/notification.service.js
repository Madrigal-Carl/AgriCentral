import api from "@/api/axios";

// params: { page, limit, unread }
export async function getNotifications(params) {
    const response = await api.get("/notifications", { params });
    return response.data;
}

export async function getUnreadNotificationCount() {
    const response = await api.get("/notifications/unread-count");
    return response.data;
}

export async function markNotificationRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
}

export async function markAllNotificationsRead() {
    const response = await api.patch("/notifications/read-all");
    return response.data;
}
