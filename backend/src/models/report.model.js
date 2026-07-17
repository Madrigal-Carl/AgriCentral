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
    {
        _id: false,
        timestamps: true,
    }
);

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
    }
);

const reportSchema = new mongoose.Schema(
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
            enum: ["farm", "livestock", "equipment"],
            required: true,
        },
        // Farm ID when reporting crops in a farm
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        condition: {
            type: String,
            required: true,
            trim: true,
        },
        itemIds: {
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
        attachments: [attachmentSchema],
        approvalStatus: {
            aew: {
                type: approvalSchema,
            },
            coordinator: {
                type: approvalSchema,
            },
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

reportSchema.pre("validate", function () {
    if (this.entityType === "farm" && !this.parentId) {
        throw new Error("parentId (farm) is required for farm reports");
    }
});

export default mongoose.model("Report", reportSchema);