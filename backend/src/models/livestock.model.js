import mongoose from "mongoose";

const livestockSchema = new mongoose.Schema(
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
        animal: {
            type: String,
            required: true,
            trim: true,
        },
        breed: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: [
                "male",
                "female",
            ],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
        },
        weight: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        condition: {
            type: String,
            enum: [
                "healthy",
                "pregnant",
                "sick",
                "deceased",
            ],
            default: "healthy",
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
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Livestock", livestockSchema);