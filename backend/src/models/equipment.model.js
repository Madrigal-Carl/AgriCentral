import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        tag: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        condition: {
            type: String,
            enum: [
                "good",
                "excellent",
                "damaged",
                "maintenance",
            ],
            default: "good",
        },
        status: {
            type: String,
            enum: [
                "assigned",
                "available",
            ],
            default: "available",
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Equipment", equipmentSchema);