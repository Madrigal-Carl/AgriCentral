import mongoose from "mongoose";

// Expire notifications 90 days after they were created.
export const NOTIFICATION_TTL_SECONDS = 90 * 24 * 60 * 60;

// One in-app notification per recipient, copied from the log that caused it.
const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        entityType: {
            type: String,
            enum: ["farm", "farmer", "livestock", "equipment", "crop", "report", "request", "maintenance"],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
            default: null,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_TTL_SECONDS });
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
