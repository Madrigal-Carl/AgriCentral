import mongoose from "mongoose";

const farmCropSchema = new mongoose.Schema(
    {
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: true,
        },
        status: {
            type: String,
            enum: [
                "planted",
                "growing",
                "withered",
                "harvested",
                "destroyed",
            ],
            default: "planted",
        },
        yield: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

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
                ref: "Farmer",
            },
        ],
        crops: [farmCropSchema],
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