import mongoose from "mongoose";

const farmCropSchema = new mongoose.Schema(
    {
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: true,
        },
        farm: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farm",
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

export default mongoose.model("FarmCrop", farmCropSchema);