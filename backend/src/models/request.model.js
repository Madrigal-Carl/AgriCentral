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

// Release proof uploaded by the coordinator (images only).
const releaseAttachmentSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, trim: true },
        publicId: { type: String, required: true, trim: true },
        resourceType: { type: String, enum: ["image"], default: "image" },
    },
    { _id: false }
);

// One entry per release action (partial releases included), each with its
// own images.
const releaseSchema = new mongoose.Schema(
    {
        releasedAt: { type: Date, required: true },
        releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        itemIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        attachments: {
            type: [releaseAttachmentSchema],
            validate: {
                validator: (files) => files.length > 0,
                message: "A release needs at least one image",
            },
        },
    },
    { _id: true }
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
        lines: [{
            _id: false,
            key: { type: mongoose.Schema.Types.ObjectId, required: true },
            name: { type: String, trim: true },
            quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
        }],
        // Bound by the system at head approval, never supplied by the client.
        entityIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        releasedIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        releases: { type: [releaseSchema], default: [] },
        legacyMaintenance: { type: mongoose.Schema.Types.Mixed, select: false },
        // Serializes review/revert/release/edit on the same request.
        operationLock: { type: String, select: false },
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
