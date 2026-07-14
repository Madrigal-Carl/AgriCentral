import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        kilo: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        status: {
            type: String,
            enum: ["planted", "not_planted"],
            default: "not_planted",
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