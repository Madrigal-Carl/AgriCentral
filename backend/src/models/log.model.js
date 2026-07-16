import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: ["farm", "farmer", "livestock", "equipment", "crop", "report", "request"],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Log", logSchema);