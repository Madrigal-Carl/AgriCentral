import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Every handler is scoped to the signed-in user (req.user).
export const getNotificationsHandler = asyncHandler(async (req, res) => {
    const { notifications, pagination } = await getNotifications(req.user._id, req.query);

    return res.status(200).json({
        message: "Notifications fetched successfully",
        notifications,
        pagination,
    });
});

export const getUnreadNotificationCountHandler = asyncHandler(async (req, res) => {
    const count = await getUnreadNotificationCount(req.user._id);

    return res.status(200).json({
        message: "Unread count fetched successfully",
        count,
    });
});

export const markNotificationReadHandler = asyncHandler(async (req, res) => {
    const notification = await markNotificationRead(req.params.id, req.user._id);

    return res.status(200).json({
        message: "Notification marked as read",
        notification,
    });
});

export const markAllNotificationsReadHandler = asyncHandler(async (req, res) => {
    const { modifiedCount } = await markAllNotificationsRead(req.user._id);

    return res.status(200).json({
        message: "All notifications marked as read",
        modifiedCount,
    });
});
