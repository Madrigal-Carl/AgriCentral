import Notification from "../models/notification.model.js";
import { getNotificationRecipients } from "../services/notification.service.js";

// The newest seeded logs get notifications, using the same recipient rules
// as createLog. Every log would flood each staff bell with hundreds of rows.
const NOTIFIED_LOG_COUNT = 30;
// The oldest of those are pre-read so the bell shows both states.
const READ_LOG_COUNT = 10;

export const wipeNotifications = async () => {
    const result = await Notification.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} notification(s).`);
};

export const seedNotifications = async ({ logs = [] } = {}) => {
    const newest = [...logs]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, NOTIFIED_LOG_COUNT);

    if (!newest.length) {
        console.log("  Nothing to notify (no logs provided).");
        return { notifications: [] };
    }

    const entries = [];
    for (const [index, log] of newest.entries()) {
        const recipients = await getNotificationRecipients(log);
        const readAt = index >= NOTIFIED_LOG_COUNT - READ_LOG_COUNT ? log.createdAt : null;
        for (const recipient of recipients) {
            entries.push({
                recipient,
                entityType: log.entityType,
                entityId: log.entityId,
                association: log.association ?? null,
                message: log.message,
                readAt,
                createdAt: log.createdAt,
            });
        }
    }

    const notifications = await Notification.insertMany(entries);
    console.log(`  Seeded: ${notifications.length} notification(s) for the ${newest.length} newest log(s).`);

    return { notifications };
};
