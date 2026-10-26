import mongoose from "mongoose";
import { REPORT_CONDITIONS } from "../utils/reportItems.js";
import { hasFarmReportMeasurements } from "../utils/farmReportTotals.js";

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
            required: function () { return this.entityType === "farm"; },
            trim: true,
        },
        items: [{
            _id: false,
            item: { type: mongoose.Schema.Types.ObjectId, required: true },
            condition: { type: String, required: true, trim: true },
            severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
        }],
        cropEntries: [{
            _id: false,
            crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },
            quantity: { type: Number, min: 0 },
            yieldKg: { type: Number, min: 0 },
        }],
        reportedAt: { type: Date },
        submittedByRole: { type: String, enum: ["far", "aew"] },
        // Retains old single-stage decisions without inventing a missing approval.
        legacyApprovalStatus: { type: mongoose.Schema.Types.Mixed, select: false },
        operationLock: { type: String, select: false },
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
    if (this.entityType !== "farm" && this.items?.length) {
        this.itemIds = this.items.map((entry) => entry.item);
        const order = ["low", "medium", "high", "critical"];
        this.severity = order[Math.max(...this.items.map((entry) => order.indexOf(entry.severity)))];
        this.condition = undefined;
    }
    if (this.entityType === "farm" && !this.parentId) {
        throw new Error("parentId (farm) is required for farm reports");
    }
    if (this.entityType === "farm" && (!REPORT_CONDITIONS.farm.includes(this.condition) || !hasFarmReportMeasurements(this))) {
        throw new Error("Crop reports require a report date and per-crop quantities (planted/destroyed) or yield kg (harvested)");
    }
});

reportSchema.index({ entityType: 1, deletedAt: 1, parentId: 1, "approvalStatus.aew.status": 1, "approvalStatus.coordinator.status": 1, reportedAt: 1, createdAt: 1 });

export default mongoose.model("Report", reportSchema);
