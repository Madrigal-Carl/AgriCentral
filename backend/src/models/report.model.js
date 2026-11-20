import mongoose from "mongoose";
import {
    DECEASED_CAUSES,
    DEFAULT_EQUIPMENT_USAGE_STATUS,
    DEFAULT_LIVESTOCK_REPORT_KIND,
    EQUIPMENT_USAGE_STATUSES,
    getCropReportEntries,
    highestPriority,
    LIVESTOCK_REPORT_KINDS,
    STORED_FARM_REPORT_CONDITIONS,
} from "../utils/reportItems.js";
import { hasFarmReportMeasurements } from "../utils/farmReportTotals.js";
import { CROP_STAGES } from "../utils/cropStages.js";
import {
    CROP_CONDITIONS,
    DAMAGE_REASONS,
    DISPOSITIONS,
    PLANTING_METHODS,
    PRODUCTION_UNITS,
    QUALITY_GRADES,
    SEED_CLASSES,
    SEED_OWNERSHIPS,
    STAGE_MAIN_DATE,
    validateStageData,
} from "../utils/cropStageFields.js";

// Stage-specific crop report fields, all optional here; which ones are
// required depends on the entry's stage (see validateStageData).
const stageDataSchema = new mongoose.Schema(
    {
        // newly_planted
        datePlanted: Date,
        areaPlantedHa: { type: Number, min: 0 },
        plantingMethod: { type: String, enum: PLANTING_METHODS },
        plantingMethodOther: { type: String, trim: true, maxlength: 100 },
        seedClass: { type: String, enum: SEED_CLASSES },
        seedClassOther: { type: String, trim: true, maxlength: 100 },
        seedQuantity: { type: Number, min: 0 },
        expectedHarvestDate: Date,
        seedOwnership: { type: String, enum: SEED_OWNERSHIPS },
        expectedYieldKg: { type: Number, min: 0 },
        // flowering / vegetative / reproductive
        dateStarted: Date,
        dateObserved: Date,
        areaHa: { type: Number, min: 0 },
        condition: { type: String, enum: CROP_CONDITIONS },
        subStage: { type: String, trim: true, maxlength: 100 },
        // harvested
        dateHarvested: Date,
        areaHarvestedHa: { type: Number, min: 0 },
        totalProductionValue: { type: Number, min: 0 },
        totalProductionUnit: { type: String, enum: PRODUCTION_UNITS },
        totalProductionKg: { type: Number, min: 0 },
        yieldPerHaKg: { type: Number, min: 0 },
        qualityGrade: { type: String, enum: QUALITY_GRADES },
        disposition: { type: String, enum: DISPOSITIONS },
        // damaged
        damageReason: { type: String, enum: DAMAGE_REASONS },
        damageReasonOther: { type: String, trim: true, maxlength: 100 },
        dateOccurred: Date,
        areaAffectedHa: { type: Number, min: 0 },
        estimatedLossKg: { type: Number, min: 0 },
        estimatedLossPesos: { type: Number, min: 0 },
    },
    { _id: false }
);

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
        priority: {
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
        // Crop reports: the farmer whose single crop is reported. Required
        // for new crop reports; legacy ones (stored before) have none.
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
            default: undefined,
        },
        condition: {
            type: String,
            // Read-only fallback for reports created before per-crop stages.
            trim: true,
        },
        // Livestock only (default condition); see LIVESTOCK_REPORT_KINDS.
        reportKind: { type: String, enum: LIVESTOCK_REPORT_KINDS, default: undefined },
        items: [{
            _id: false,
            item: { type: mongoose.Schema.Types.ObjectId, required: true },
            // Offspring reports carry no item conditions (and keep items empty).
            condition: {
                type: String,
                trim: true,
                required() { return this.ownerDocument?.()?.reportKind !== "offspring"; },
            },
            priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
            // Condition-kind livestock items marked deceased.
            deceased: {
                type: new mongoose.Schema(
                    {
                        cause: { type: String, enum: DECEASED_CAUSES, required: true },
                        dateOfDeath: { type: Date, required: true },
                    },
                    { _id: false }
                ),
                default: undefined,
            },
            // Equipment items: reported usage (never changes the equipment record).
            usageStatus: { type: String, enum: EQUIPMENT_USAGE_STATUSES },
            farmer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
            // Redispersal livestock items: the animal moves from one farmer
            // to another (reported only; the livestock record is unchanged).
            fromFarmer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
            toFarmer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
        }],
        // Offspring-kind livestock reports: the mother is also itemIds[0].
        offspring: {
            type: new mongoose.Schema(
                {
                    mother: { type: mongoose.Schema.Types.ObjectId, ref: "Livestock", required: true },
                    count: { type: Number, required: true, min: 1 },
                    birthDate: { type: Date, required: true },
                    notes: { type: String, trim: true, maxlength: 500 },
                },
                { _id: false }
            ),
            default: undefined,
        },
        cropEntries: [{
            _id: false,
            crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },
            // Current shape: the stage plus its stage-specific fields.
            stage: { type: String, enum: CROP_STAGES },
            stageData: { type: stageDataSchema, default: undefined },
            // Legacy shape (read-only): condition + quantity / yieldKg. Old
            // stage names stay valid so old reports can still be approved.
            condition: { type: String, enum: STORED_FARM_REPORT_CONDITIONS },
            priority: { type: String, enum: ["low", "medium", "high", "critical"] },
            quantity: { type: Number, min: 0 },
            yieldKg: { type: Number, min: 0 },
        }],
        reportedAt: { type: Date },
        submittedByRole: { type: String, enum: ["far", "aew"] },
        // Retains old single-stage decisions without inventing a missing approval.
        legacyApprovalStatus: { type: mongoose.Schema.Types.Mixed, select: false },
        // Seed moved by this report's final approval (Newly Planted only), so
        // it is applied once and reversed exactly. See utils/seedApplication.js.
        seedApplication: {
            type: new mongoose.Schema(
                {
                    crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },
                    quantity: { type: Number, min: 0, required: true },
                    ownership: { type: String, enum: ["government", "farmer"], required: true },
                    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
                    // The Farm.crops[] entry whose planted quantity was raised.
                    entry: { type: mongoose.Schema.Types.ObjectId },
                    appliedAt: { type: Date, required: true },
                },
                { _id: false }
            ),
            select: false,
            default: undefined,
        },
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

// Dates from date inputs are calendar dates at UTC midnight; allow the
// latest time zone (UTC+14) so "today" is never treated as the future.
const isFutureDay = (date) => new Date(date).getTime() > Date.now() + 14 * 60 * 60 * 1000;

reportSchema.pre("validate", function () {
    // Livestock report kind (old reports without one are condition reports).
    if (this.entityType === "livestock") this.reportKind ??= DEFAULT_LIVESTOCK_REPORT_KIND;
    else this.reportKind = undefined;
    if (this.reportKind !== "offspring") this.offspring = undefined;
    if (this.reportKind === "offspring") {
        const { mother, count, birthDate } = this.offspring ?? {};
        if (!mother) throw new Error("Offspring reports require the mother");
        if (!Number.isInteger(count) || count < 1) throw new Error("Number of offspring must be a whole number of at least 1");
        if (!birthDate || isFutureDay(birthDate)) throw new Error("Offspring birth date is required and cannot be in the future");
        this.items = [];
        this.itemIds = [mother];
        this.priority = "medium";
        this.condition = undefined;
    }
    // New or edited items must be complete; stored items stay reviewable.
    const checkItems = this.isNew || this.isModified("items") || this.isModified("reportKind");
    for (const entry of this.items ?? []) {
        if (this.reportKind !== "condition" || entry.condition !== "deceased") entry.deceased = undefined;
        else if (checkItems && (!entry.deceased?.cause || !entry.deceased?.dateOfDeath)) throw new Error("Deceased livestock require a cause and date of death");
        if (entry.deceased?.dateOfDeath && checkItems && isFutureDay(entry.deceased.dateOfDeath)) throw new Error("Date of death cannot be in the future");
        if (this.entityType !== "equipment") {
            entry.usageStatus = undefined;
            entry.farmer = undefined;
        } else {
            entry.usageStatus ??= DEFAULT_EQUIPMENT_USAGE_STATUS;
            if (entry.usageStatus !== "in_use") entry.farmer = undefined;
            else if (checkItems && !entry.farmer) throw new Error("Equipment in use requires the farmer using it");
        }
        if (this.reportKind !== "redispersal") {
            entry.fromFarmer = undefined;
            entry.toFarmer = undefined;
        } else if (checkItems) {
            if (!entry.fromFarmer || !entry.toFarmer) throw new Error("Redispersal requires the farmer giving and the farmer receiving each animal");
            if (String(entry.fromFarmer) === String(entry.toFarmer)) throw new Error("Redispersal must go to a different farmer");
        }
    }
    if (this.entityType !== "farm" && this.items?.length) {
        this.itemIds = this.items.map((entry) => entry.item);
        this.priority = highestPriority(this.items);
        this.condition = undefined;
    }
    if (this.entityType === "farm" && !this.parentId) {
        throw new Error("parentId (farm) is required for farm reports");
    }
    // New reports (and edits that touch attachments) need at least one image.
    // Reviews never modify attachments, so legacy reports stay reviewable.
    if ((this.isNew || this.isModified("attachments")) && !this.attachments?.some((file) => file.resourceType === "image")) {
        throw new Error("Reports require at least one image");
    }
    if (this.entityType !== "farm") this.farmer = undefined;
    if (this.entityType === "farm" && this.isNew) {
        if (!this.farmer) throw new Error("Farmer is required for crop reports");
        if ((this.cropEntries?.length ?? 0) > 1 || (this.itemIds?.length ?? 0) > 1) throw new Error("A crop report covers exactly one crop");
    }
    if (this.entityType === "farm") {
        this.cropEntries = getCropReportEntries(this);
        this.priority = highestPriority(this.cropEntries);
        this.condition = undefined;
        if (this.isNew && !this.cropEntries.every((entry) => entry.stage)) {
            throw new Error("Crop reports require a stage and its fields");
        }
        for (const entry of this.cropEntries) {
            if (!entry.stage) continue; // legacy entry
            const [issue] = validateStageData(entry.stage, entry.stageData);
            if (issue) throw new Error(issue.message);
            // reportedAt always follows the stage's main date.
            this.reportedAt = entry.stageData[STAGE_MAIN_DATE[entry.stage]];
        }
        if (!hasFarmReportMeasurements(this)) {
            throw new Error("Crop reports require a report date and valid stage fields");
        }
    }
});

reportSchema.index({ entityType: 1, deletedAt: 1, parentId: 1, "approvalStatus.aew.status": 1, "approvalStatus.coordinator.status": 1, reportedAt: 1, createdAt: 1 });

export default mongoose.model("Report", reportSchema);
