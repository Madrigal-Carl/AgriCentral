import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
    {
        tag: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        assignedFarmers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Farm", farmSchema);