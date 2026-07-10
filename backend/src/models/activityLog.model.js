import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: ["farmCrop", "crop", "livestock", "equipment"],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("ActivityLog", activityLogSchema);
