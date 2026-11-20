import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "@/utils/meaningfulName";
import {
    CROP_STAGE_OPTIONS,
    DECEASED_CAUSE_OPTIONS,
    EQUIPMENT_CONDITION_OPTIONS,
    EQUIPMENT_USAGE_OPTIONS,
    LIVESTOCK_HEALTH_OPTIONS,
    REPORT_KIND_OPTIONS,
} from "@/constants/data";
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
    isFutureDate,
} from "@/constants/cropStageFields";

const PRIORITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["farm", "livestock", "equipment"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

/* ---------------- Crop stage fields ---------------- */

// Number inputs hand over numbers (or undefined when empty); dates are
// YYYY-MM-DD strings from date inputs.
const dateField = (label) => z.string({ error: `${label} is required` }).min(1, `${label} is required`);
const areaField = (label) => z.number({ error: `${label} is required` }).finite().positive(`${label} must be greater than 0 ha`);
const positiveField = (label) => z.number({ error: `${label} is required` }).finite().positive(`${label} must be greater than 0`);
const choice = (values, label) => z.enum(values, { error: `Select ${label}` });
const otherText = z.string().trim().max(100, "Must not exceed 100 characters").optional();
const lossField = z.number().finite().min(0, "Estimated loss cannot be negative").optional();

const STAGE_DATA_SHAPES = {
    newly_planted: {
        datePlanted: dateField("Date planted"),
        areaPlantedHa: areaField("Area planted"),
        plantingMethod: choice(PLANTING_METHODS, "a planting method"),
        plantingMethodOther: otherText,
        seedClass: choice(SEED_CLASSES, "a seed class"),
        seedClassOther: otherText,
        seedQuantity: positiveField("Quantity of seeds"),
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
        disposition: z.union([z.enum(DISPOSITIONS), z.literal("")], { error: "Select a valid disposition" }).optional(),
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

// Cross-field rules (other text, dates not in the future, expected harvest
// after planting, whole seed count, at least one loss) come from the shared
// validateStageData; fields zod already flagged are skipped.
const stageDataSchema = (stage) => {
    const shape = STAGE_DATA_SHAPES[stage];
    return z.object(shape).superRefine((data, ctx) => {
        for (const { path, message } of validateStageData(stage, data)) {
            if (shape[path] && !shape[path].safeParse(data?.[path]).success) continue;
            ctx.addIssue({ code: "custom", path: [path], message });
        }
    }, { when: () => true });
};

// The crop's stage and its fields, discriminated on stage.
export const cropStageEntrySchema = z.discriminatedUnion(
    "stage",
    CROP_STAGE_OPTIONS.map(({ value }) => z.object({ stage: z.literal(value), stageData: stageDataSchema(value) })),
    { error: "Select a crop stage" },
);

// An attachment that has already been uploaded to Cloudinary and resolved
// (either loaded from an existing report, or already finished uploading).
const attachmentSchema = z.object({
    url: z.string(),
    publicId: z.string(),
    resourceType: z.string().optional(),
});

// A file the user just picked in FileUploader but that hasn't been sent to
// Cloudinary yet — resolveAttachments() (in useReports) turns this into an
// attachmentSchema shape at submit time. We must accept this shape here too,
// otherwise validation fails before resolveAttachments ever runs.
// `.passthrough()` preserves id/name/size/progress/status, which FileUploader
// relies on for its uploading-row UI.
const pendingFileSchema = z
    .object({
        file: z.instanceof(File),
    })
    .passthrough();

const fileFieldSchema = z.union([attachmentSchema, pendingFileSchema]);

// Reports need at least one image, and accept images only. Applies on edit
// too, so an edit only fails when it would leave the report with none.
const isImageFile = (f) => f?.file instanceof File
    ? f.file.type.startsWith("image/")
    : (f?.resourceType ?? "image") === "image";
const filesSchema = z
    .array(fileFieldSchema)
    .optional()
    .default([])
    .refine((files) => files.length > 0, "Add at least one image")
    .refine((files) => files.every(isImageFile), "Only image files are allowed");

const baseReportForm = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .max(100, "Title must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Select a type" }),
    // Crop reports: farm -> farmer -> one crop, with its stage, the stage's
    // fields (checked by cropStageEntrySchema) and priority.
    farm: z.union([objectId("Select a farm"), z.literal("")]).optional(),
    farmer: z.union([objectId("Select a farmer"), z.literal("")]).optional(),
    crop: z.union([objectId("Select a crop"), z.literal("")]).optional(),
    stage: z.string().optional(),
    stageData: z.record(z.string(), z.any()).optional(),
    priority: z.enum(PRIORITIES).optional().default("medium"),
    // Livestock only: condition | offspring | redispersal.
    reportKind: z.union([z.enum(REPORT_KIND_OPTIONS.map((o) => o.value)), z.literal("")]).optional(),
    items: z.array(z.object({
        itemId: objectId("Invalid item"),
        condition: z.string().trim().min(1, "Select a condition"),
        priority: z.enum(PRIORITIES).default("medium"),
        // Condition-kind deceased livestock (checked in refineItems).
        deceased: z.object({ cause: z.string().optional(), dateOfDeath: z.string().optional() }).optional(),
        // Equipment: reported usage; a farmer is required while in use.
        usageStatus: z.string().optional(),
        farmer: z.string().optional(),
        // Redispersal livestock: from one farmer to another.
        fromFarmer: z.string().optional(),
        toFarmer: z.string().optional(),
    })).optional(),
    // Offspring-kind livestock reports.
    mother: z.string().optional(),
    offspringCount: z.preprocess(
        (value) => (value === "" || value == null || Number.isNaN(value) ? undefined : Number(value)),
        z.number().optional(),
    ),
    offspringBirthDate: z.string().optional(),
    offspringNotes: z.string().trim().max(500, "Notes must not exceed 500 characters").optional(),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
    files: filesSchema,
    association: z
        .union([objectId("Select an association"), z.literal("")])
        .optional(),
});

function refineItems(data, ctx) {
    const issue = (path, message) => ctx.addIssue({ code: "custom", path, message });
    if (data.entityType === "farm") {
        if (!data.farm) issue(["farm"], "Select a farm");
        if (!data.farmer) issue(["farmer"], "Select a farmer");
        if (!data.crop) issue(["crop"], "Select a crop");
        const stage = cropStageEntrySchema.safeParse({ stage: data.stage, stageData: data.stageData ?? {} });
        for (const { path, message } of stage.success ? [] : stage.error.issues) {
            issue(path[0] === "stageData" ? path : ["stage"], message);
        }
    } else {
        const kind = data.entityType === "livestock" ? data.reportKind || "condition" : undefined;
        if (kind === "offspring") {
            // The mother and the newborns; no items, conditions or priority.
            if (!data.mother) issue(["mother"], "Select the mother");
            if (!Number.isInteger(data.offspringCount) || data.offspringCount < 1) issue(["offspringCount"], "Number of offspring must be a whole number of at least 1");
            if (!data.offspringBirthDate) issue(["offspringBirthDate"], "Birth date is required");
            else if (isFutureDate(data.offspringBirthDate)) issue(["offspringBirthDate"], "Birth date cannot be in the future");
            return;
        }
        if (!data.items?.length) issue(["items"], "Select at least one item");
        const options = data.entityType === "equipment" ? EQUIPMENT_CONDITION_OPTIONS : LIVESTOCK_HEALTH_OPTIONS;
        const seen = new Set();
        (data.items ?? []).forEach((item, index) => {
            if (seen.has(item.itemId)) issue(["items", index, "itemId"], "Duplicate items are not allowed");
            seen.add(item.itemId);
            if (!options.some((option) => option.value === item.condition)) issue(["items", index, "condition"], "Select a valid condition");
            // Deceased (condition kind): cause and a date of death not in the
            // future (not before birth is checked against the animal on submit).
            if (kind === "condition" && item.condition === "deceased") {
                if (!DECEASED_CAUSE_OPTIONS.some((option) => option.value === item.deceased?.cause)) issue(["items", index, "deceased", "cause"], "Select the cause of death");
                if (!item.deceased?.dateOfDeath) issue(["items", index, "deceased", "dateOfDeath"], "Date of death is required");
                else if (isFutureDate(item.deceased.dateOfDeath)) issue(["items", index, "deceased", "dateOfDeath"], "Date of death cannot be in the future");
            }
            if (data.entityType === "equipment") {
                if (!EQUIPMENT_USAGE_OPTIONS.some((option) => option.value === (item.usageStatus ?? "idle"))) issue(["items", index, "usageStatus"], "Select an equipment status");
                if (item.usageStatus === "in_use" && !item.farmer) issue(["items", index, "farmer"], "Select the farmer using this equipment");
            }
            if (kind === "redispersal") {
                if (!item.fromFarmer) issue(["items", index, "fromFarmer"], "Select the farmer giving the animal");
                if (!item.toFarmer) issue(["items", index, "toFarmer"], "Select the farmer receiving the animal");
                else if (item.toFarmer === item.fromFarmer) issue(["items", index, "toFarmer"], "Select a different farmer");
            }
        });
    }
}

// far never sends association (server derives it); aew must pick one.
export function createReportFormSchema(isFar) {
    return baseReportForm
        .superRefine(refineItems)
        .refine((data) => isFar || !!data.association, {
            message: "Association is required",
            path: ["association"],
        });
}

export function createReportUpdateSchema() {
    return baseReportForm.superRefine(refineItems);
}
