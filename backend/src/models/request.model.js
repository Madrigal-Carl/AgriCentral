import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["pending", "approved", "denied"],
            default: "pending",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        remarks: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        _id: false,
        timestamps: true,
    }
);

const requestSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
        },
        entityType: {
            type: String,
            enum: ["livestock", "equipment"],
            required: true,
        },
        entityIds: {
            type: [mongoose.Schema.Types.ObjectId],
            required: true,
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: "At least one item must be selected",
            },
        },
        details: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000,
        },
        approvalStatus: {
            coordinator: {
                type: approvalSchema,
            },
            governor: {
                type: approvalSchema,
            },
            head: {
                type: approvalSchema,
            },
        },
        releaseStatus: {
            type: String,
            enum: ["pending", "partial", "released"],
            default: "pending",
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

export default mongoose.model("Request", requestSchema);