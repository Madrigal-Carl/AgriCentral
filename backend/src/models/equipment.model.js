import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        propertyNumber: {
            type: String,
            required: true,
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
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

equipmentSchema.index(
    { propertyNumber: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Equipment", equipmentSchema);