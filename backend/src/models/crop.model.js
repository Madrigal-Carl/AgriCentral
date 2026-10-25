import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        cropType: { type: mongoose.Schema.Types.ObjectId, ref: "CropType", required: true },
        name: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        unplanted: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        isDistributed: {
            type: Boolean,
            default: false,
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

export default mongoose.model("Crop", cropSchema);
