import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
        emailAddress: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        position: {
            type: String,
            enum: [
                "president",
                "vice_president",
                "secretary",
                "treasurer",
                "auditor",
                "pio",
                "project_manager",
                "director",
                "member",
            ],
            default: "member",
        },
        attachments: [
            {
                type: String,
                trim: true,
            },
        ],
        status: {
            type: String,
            enum: [
                "active",
                "inactive",
            ],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Farmer", farmerSchema);