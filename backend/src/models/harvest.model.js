import mongoose from "mongoose";

const harvestSchema = new mongoose.Schema(
    {
        farm: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farm",
            required: true,
        },
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        harvestedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

harvestSchema.index({ association: 1, harvestedAt: 1 });
harvestSchema.index({ farm: 1, harvestedAt: 1 });

export default mongoose.model("Harvest", harvestSchema);