import { z } from "zod";
import {
    DECEASED_CAUSES,
    EQUIPMENT_USAGE_STATUSES,
    LIVESTOCK_REPORT_KINDS,
    REPORT_CONDITIONS,
} from "../utils/reportItems.js";
import { isFutureDate } from "../utils/cropStageFields.js";
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
    validateStageData,
} from "../utils/cropStageFields.js";

const PRIORITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["farm", "livestock", "equipment"];
const OVERALL_STATUSES = ["pending", "approved", "denied"];
const STAGES = ["far", "aew", "coordinator"];
const APPROVAL_DECISIONS = ["approved", "denied"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

/* ---------------- Crop stage fields ---------------- */

const dateField = (label) => z.coerce.date({ error: `${label} is required` });
const areaField = (label) => z.number({ error: `${label} is required` }).finite().positive(`${label} must be greater than 0 ha`);
const positiveField = (label) => z.number({ error: `${label} is required` }).finite().positive(`${label} must be greater than 0`);
const choice = (values, label) => z.enum(values, { error: `Select ${label}` });
const otherText = z.string().trim().max(100).optional();
const lossField = z.number().finite().min(0, "Estimated loss cannot be negative").optional();

// Base shapes per stage; cross-field rules ("other" text, expected harvest
// after planting, no future dates, at least one loss) come from the shared
// validateStageData so the model and service apply the same rules.
const STAGE_DATA_SHAPES = {
    newly_planted: {
        datePlanted: dateField("Date planted"),
        areaPlantedHa: areaField("Area planted"),
        plantingMethod: choice(PLANTING_METHODS, "a planting method"),
        plantingMethodOther: otherText,
        seedClass: choice(SEED_CLASSES, "a seed class"),
        seedClassOther: otherText,
        // Whole-number rule comes from validateStageData: zod's .int() would
        // stop the cross-field rules from reporting alongside it.
        seedQuantity: z.number({ error: "Quantity of seeds is required" }).finite().positive("Quantity of seeds must be greater than 0"),
        expectedHarvestDate: dateField("Expected harvest date"),
        seedOwnership: choice(SEED_OWNERSHIPS, "the seed ownership"),
        expectedYieldKg: positiveField("Expected yield (kg)"),
    },
    flowering: {
        dateStarted: dateField("Date flowering started"),
        areaHa: areaField("Area"),
        condition: choice(CROP_CONDITIONS, "a condition"),
    },
    vegetative: {
        dateStarted: dateField("Date vegetative started"),
        areaHa: areaField("Area"),
        condition: choice(CROP_CONDITIONS, "a condition"),
    },
    reproductive: {
        dateObserved: dateField("Date observed"),
        areaHa: areaField("Area"),
        subStage: z.string({ error: "Select a sub-stage" }).trim().min(1, "Select a sub-stage"),
    },
    harvested: {
        dateHarvested: dateField("Date harvested"),
        areaHarvestedHa: areaField("Area harvested"),
        totalProductionValue: positiveField("Total production"),
        totalProductionUnit: choice(PRODUCTION_UNITS, "a production unit"),
        yieldPerHaKg: positiveField("Yield per hectare (kg)"),
        qualityGrade: choice(QUALITY_GRADES, "a quality grade"),
        disposition: z.enum(DISPOSITIONS, { error: "Select a valid disposition" }).optional(),
    },
    damaged: {
        damageReason: choice(DAMAGE_REASONS, "a damage reason"),
        damageReasonOther: otherText,
        dateOccurred: dateField("Date occurred"),
        areaAffectedHa: areaField("Area affected"),
        estimatedLossKg: lossField,
        estimatedLossPesos: lossField,
    },
};

// Runs even when a base field failed (when: always), so every problem is
// reported at once; fields zod already flagged are skipped to avoid duplicates.
const stageDataSchema = (stage) => {
    const shape = STAGE_DATA_SHAPES[stage];
    return z.object(shape).superRefine((data, ctx) => {
        for (const { path, message } of validateStageData(stage, data)) {
            if (shape[path] && !shape[path].safeParse(data?.[path]).success) continue;
            ctx.addIssue({ code: "custom", path: [path], message });
        }
    }, { when: () => true });
};

// One crop entry, discriminated on its stage.
const cropEntrySchema = z.discriminatedUnion("stage", CROP_STAGES.map((stage) => z.object({
    crop: objectId("Invalid crop id"),
    stage: z.literal(stage),
    priority: z.enum(PRIORITIES).optional(),
    stageData: stageDataSchema(stage),
})), { error: "Select a crop stage" });

// Report attachments are images only.
const attachmentSchema = z.object({
    url: z.string().trim().url("Invalid attachment URL"),
    publicId: z.string().trim().min(1, "Missing attachment public id"),
    resourceType: z.literal("image", { error: "Only image attachments are allowed" }).optional().default("image"),
});

export const IMAGE_REQUIRED_MESSAGE = "Add at least one image";

// associationId is optional here: far never sends it (derived from the
// authenticated user in report.service.js), aew must send it.
const baseReportObject = z.object({
    associationId: objectId("Invalid association id").optional(),
    // Picked from the maintained report titles (checked in report.service.js).
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .min(1, "Select a title")
        .max(100, "Title must not exceed 100 characters"),
    priority: z.enum(PRIORITIES).optional().default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Entity type is required" }),
    parentId: objectId("Invalid farm id").optional(),
    // Crop reports: the farmer whose crop is reported (one crop per report).
    farmer: objectId("Invalid farmer id").optional(),
    condition: z
        .string()
        .trim()
        .optional(),
    // Crop reports: set from the stage's main date (see normalizeReportItems).
    reportedAt: z.string().datetime({ offset: true, message: "Select a valid report date" }).optional(),
    cropEntries: z.array(cropEntrySchema).optional(),
    itemIds: z
        .array(objectId("Invalid item id"))
        .refine((arr) => new Set(arr).size === arr.length, {
            message: "Duplicate items are not allowed",
        }).optional(),
    // Livestock only: condition (default) | offspring | redispersal.
    reportKind: z.enum(LIVESTOCK_REPORT_KINDS, { error: "Select a report kind" }).optional(),
    items: z.array(z.object({
        itemId: objectId("Invalid item id"),
        condition: z.string().trim().min(1, "Condition is required"),
        priority: z.enum(PRIORITIES).default("medium"),
        // Condition-kind livestock items marked deceased.
        deceased: z.object({
            cause: z.enum(DECEASED_CAUSES, { error: "Select the cause of death" }),
            dateOfDeath: z.coerce.date({ error: "Date of death is required" }),
        }).optional(),
        // Equipment items: reported usage; a farmer is required while in use.
        usageStatus: z.enum(EQUIPMENT_USAGE_STATUSES, { error: "Select an equipment status" }).optional(),
        farmer: objectId("Invalid farmer id").optional(),
        // Redispersal livestock items: from one farmer to another.
        fromFarmer: objectId("Select the farmer giving the animal").optional(),
        toFarmer: objectId("Select the farmer receiving the animal").optional(),
    })).optional(),
    // Offspring-kind livestock reports.
    offspring: z.object({
        mother: objectId("Select the mother"),
        count: z.number({ error: "Number of offspring is required" }).int("Number of offspring must be a whole number").min(1, "Number of offspring must be at least 1"),
        birthDate: z.coerce.date({ error: "Birth date is required" }),
        notes: z.string().trim().max(500, "Notes must not exceed 500 characters").optional(),
    }).optional(),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
    attachments: z.array(attachmentSchema).optional().default([]),
});

export function refineReportItems(data, ctx, partial = false) {
    const issue = (path, message) => ctx.addIssue({ code: "custom", path, message });
    if (data.entityType === "farm") {
        if (!partial && !data.parentId) issue(["parentId"], "parentId (farm) is required for farm reports");
        if (!partial && !data.farmer) issue(["farmer"], "Select a farmer");
        if ((!partial || data.itemIds) && !data.itemIds?.length) issue(["itemIds"], "Select a crop");
        if (data.itemIds?.length > 1) issue(["itemIds"], "A crop report covers exactly one crop");
        if (data.items?.length) issue(["items"], "Use itemIds for farm reports");
        if (!partial || data.cropEntries) {
            const entries = data.cropEntries ?? [];
            if (!entries.length) issue(["cropEntries"], "Select the crop's stage and fill in its fields");
            if (entries.length > 1) issue(["cropEntries"], "A crop report covers exactly one crop");
            const ids = entries.map((entry) => entry.crop);
            if (new Set(ids).size !== ids.length) issue(["cropEntries"], "Duplicate crops are not allowed");
            if (!partial && (ids.length !== data.itemIds?.length || ids.some((id) => !data.itemIds?.includes(id)))) issue(["cropEntries"], "Measurements must match the selected crops");
        }
    } else if (data.entityType || data.items) {
        if (data.reportKind && data.entityType && data.entityType !== "livestock") issue(["reportKind"], "Report kinds apply to livestock reports only");
        // A partial update without its type can't tell the kind; the service
        // re-checks the merged report against the full schema.
        if (partial && !data.entityType) return;
        const kind = data.entityType === "livestock" ? data.reportKind ?? "condition" : undefined;
        if (kind === "offspring") {
            // One mother and the newborn details; no items, conditions or priority.
            if (data.items?.length) issue(["items"], "Offspring reports select the mother only");
            if ((!partial || data.offspring) && !data.offspring) issue(["offspring", "mother"], "Select the mother");
            if (data.offspring?.birthDate && isFutureDate(data.offspring.birthDate)) issue(["offspring", "birthDate"], "Birth date cannot be in the future");
            return;
        }
        if (data.offspring) issue(["offspring"], "Offspring details apply to offspring reports only");
        if ((!partial || data.items) && !data.items?.length) issue(["items"], "Select at least one item");
        const seen = new Set();
        for (const [index, item] of (data.items ?? []).entries()) {
            if (seen.has(item.itemId)) issue(["items", index, "itemId"], "Duplicate items are not allowed");
            seen.add(item.itemId);
            if (data.entityType && !REPORT_CONDITIONS[data.entityType]?.includes(item.condition)) {
                issue(["items", index, "condition"], "Select a valid condition for this type");
            }
            if (kind === "condition" && item.condition === "deceased") {
                if (!item.deceased) issue(["items", index, "deceased"], "Enter the cause and date of death");
                else if (isFutureDate(item.deceased.dateOfDeath)) issue(["items", index, "deceased", "dateOfDeath"], "Date of death cannot be in the future");
            }
            if (data.entityType === "equipment" && item.usageStatus === "in_use" && !item.farmer) {
                issue(["items", index, "farmer"], "Select the farmer using this equipment");
            }
            if (kind === "redispersal") {
                if (!item.fromFarmer) issue(["items", index, "fromFarmer"], "Select the farmer giving the animal");
                if (!item.toFarmer) issue(["items", index, "toFarmer"], "Select the farmer receiving the animal");
                if (item.fromFarmer && item.fromFarmer === item.toFarmer) issue(["items", index, "toFarmer"], "Select a different farmer");
            }
        }
    }
}

// Every report needs at least one image. updateReport re-checks the merged
// report against this schema, so an edit only fails when it would leave none.
export const createReportSchema = baseReportObject.superRefine((data, ctx) => {
    refineReportItems(data, ctx);
    if (!data.attachments?.length) ctx.addIssue({ code: "custom", path: ["attachments"], message: IMAGE_REQUIRED_MESSAGE });
});

export const updateReportSchema = baseReportObject
    .partial()
    .extend({ priority: z.enum(PRIORITIES).optional(), attachments: z.array(attachmentSchema).optional() })
    .superRefine((data, ctx) => {
        // Partial updates are checked again against the persisted entity type in the service.
        if (data.entityType || data.items) refineReportItems(data, ctx, true);
        if (data.attachments && !data.attachments.length) ctx.addIssue({ code: "custom", path: ["attachments"], message: IMAGE_REQUIRED_MESSAGE });
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const updateReportApprovalSchema = z
    .object({
        status: z.enum(APPROVAL_DECISIONS, { required_error: "Status is required" }),
        remarks: z
            .string()
            .trim()
            .max(500, "Remarks must not exceed 500 characters")
            .optional()
            .default(""),
    })
    .refine(
        (data) => data.status !== "denied" || data.remarks.length >= 5,
        {
            message: "Remarks are required when denying a report (at least 5 characters)",
            path: ["remarks"],
        },
    );

export const reportIdParamSchema = z.object({
    id: objectId("Invalid report id"),
});

export const getReportsQuerySchema = z.object({
    // One record by id (opening a notification's record); role scoping still applies.
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid record id").optional(),
    date: z.string().date("Invalid report date").optional(),
    timezoneOffset: z.coerce.number().int().min(-840).max(840).optional().default(0),
    status: z.enum(OVERALL_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    entityType: z.enum(ENTITY_TYPES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    stage: z.enum(STAGES).optional(),
    associationId: objectId("Invalid association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});
