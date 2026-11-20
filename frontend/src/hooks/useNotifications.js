import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "@/services/notification.service";

export const UNREAD_COUNT_REFETCH_MS = 30_000;

/* ---------------- Query Keys ---------------- */
// Keyed by user so a different sign-in never sees cached notifications.
export const notificationKeys = {
    all: ["notifications"],
    user: (userId) => [...notificationKeys.all, userId ?? "anonymous"],
    list: (userId, filters) => [...notificationKeys.user(userId), "list", filters],
    unreadCount: (userId) => [...notificationKeys.user(userId), "unread-count"],
};

/* ---------------- Queries ---------------- */
export function useNotifications(userId, filters = {}, options = {}) {
    return useQuery({
        queryKey: notificationKeys.list(userId, filters),
        queryFn: () => getNotifications(filters),
        enabled: !!userId,
        ...options,
    });
}

export function useUnreadNotificationCount(userId, options = {}) {
    return useQuery({
        queryKey: notificationKeys.unreadCount(userId),
        queryFn: getUnreadNotificationCount,
        enabled: !!userId,
        refetchInterval: UNREAD_COUNT_REFETCH_MS,
        refetchOnWindowFocus: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
// Both refresh the list and the unread count.
function useInvalidateNotifications() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkNotificationRead(options = {}) {
    const invalidate = useInvalidateNotifications();
    return useMutation({
        mutationFn: (id) => markNotificationRead(id),
        ...options,
        onSuccess: (...args) => {
            invalidate();
            options.onSuccess?.(...args);
        },
    });
}

export function useMarkAllNotificationsRead(options = {}) {
    const invalidate = useInvalidateNotifications();
    return useMutation({
        mutationFn: () => markAllNotificationsRead(),
        ...options,
        onSuccess: (...args) => {
            invalidate();
            options.onSuccess?.(...args);
        },
    });
}
