import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import Association from "../models/association.model.js";
import User from "../models/user.model.js";

// Staff roles that hear about every log; governor and head only follow requests.
const ALWAYS_NOTIFIED_ROLES = ["admin", "aew", "coordinator"];
const REQUEST_ONLY_ROLES = ["governor", "head"];

// A populated association document counts as its id.
const toAssociationId = (association) => association?._id ?? association ?? null;

// Recipients: the association's FAR user, admin/aew/coordinator, and
// governor/head for requests. De-duplicated by user id.
export const getNotificationRecipients = async ({ entityType, association }) => {
    const associationId = toAssociationId(association);
    const roles = entityType === "request"
        ? [...ALWAYS_NOTIFIED_ROLES, ...REQUEST_ONLY_ROLES]
        : ALWAYS_NOTIFIED_ROLES;

    const [staff, owner] = await Promise.all([
        User.find({ role: { $in: roles } }).select("_id").lean(),
        associationId
            ? Association.findById(associationId).select("user").lean()
            : null,
    ]);

    const ids = new Set(staff.map((user) => String(user._id)));
    if (owner?.user) ids.add(String(owner.user));
    return [...ids];
};

// Called from createLog; the caller already swallows errors.
export const createNotificationsForLog = async ({ entityType, entityId, association, message }) => {
    const recipients = await getNotificationRecipients({ entityType, association });
    if (!recipients.length) return [];

    return Notification.insertMany(
        recipients.map((recipient) => ({
            recipient,
            entityType,
            entityId,
            association: toAssociationId(association),
            message,
        })),
    );
};

const notFound = () => {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    return error;
};

export const getNotifications = async (userId, { unread = false, page = 1, limit = 20 } = {}) => {
    const filter = { recipient: userId, ...(unread && { readAt: null }) };
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
    ]);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getUnreadNotificationCount = (userId) =>
    Notification.countDocuments({ recipient: userId, readAt: null });

// Only the recipient can mark their own notification; reading twice keeps
// the first readAt.
export const markNotificationRead = async (id, userId) => {
    if (!mongoose.isValidObjectId(id)) throw notFound();

    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: userId, readAt: null },
        { $set: { readAt: new Date() } },
        { new: true },
    ).lean();
    if (notification) return notification;

    const existing = await Notification.findOne({ _id: id, recipient: userId }).lean();
    if (!existing) throw notFound();
    return existing;
};

export const markAllNotificationsRead = async (userId) => {
    const result = await Notification.updateMany(
        { recipient: userId, readAt: null },
        { $set: { readAt: new Date() } },
    );
    return { modifiedCount: result.modifiedCount };
};
