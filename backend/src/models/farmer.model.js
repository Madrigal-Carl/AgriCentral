import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true,
        },
        publicId: {
            type: String,
            required: true,
            trim: true,
        },
        resourceType: {
            type: String,
            enum: ["image", "raw", "video"],
            default: "image",
        },
    },
    { _id: false },
);

const farmerSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
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
        attachments: [attachmentSchema],
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
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

export default mongoose.model("Farmer", farmerSchema);