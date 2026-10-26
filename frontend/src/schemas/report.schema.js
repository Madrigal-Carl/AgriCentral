import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "@/utils/meaningfulName";
import { EQUIPMENT_CONDITION_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";

const SEVERITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["farm", "livestock", "equipment"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

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

const baseReportForm = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .max(100, "Title must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    severity: z.enum(SEVERITIES).default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Select a type" }),
    farm: z.union([objectId("Select a farm"), z.literal("")]).optional(),
    itemIds: z
        .array(objectId("Invalid item"))
        .optional(),
    items: z.array(z.object({
        itemId: objectId("Invalid item"),
        condition: z.string().trim().min(1, "Select a condition"),
        severity: z.enum(SEVERITIES).default("medium"),
    })).optional(),
    condition: z.string().optional(),
    reportedAt: z.string().optional(),
    cropEntries: z.array(z.object({
        crop: objectId("Invalid crop"),
        quantity: z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().finite().positive("Quantity must be greater than zero").optional()),
        yieldKg: z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().finite().positive("Yield kg must be greater than zero").optional()),
    })).optional(),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
    files: z.array(fileFieldSchema).optional().default([]),
    association: z
        .union([objectId("Select an association"), z.literal("")])
        .optional(),
});

function refineItems(data, ctx) {
    const issue = (path, message) => ctx.addIssue({ code: "custom", path, message });
    if (data.entityType === "farm") {
        if (!data.farm) issue(["farm"], "Farm is required for farm reports");
        if (!data.itemIds?.length) issue(["itemIds"], "Select at least one crop");
        if (new Set(data.itemIds).size !== data.itemIds?.length) issue(["itemIds"], "Duplicate crops are not allowed");
        if (!["planted", "growing", "withered", "harvested", "damaged", "destroyed"].includes(data.condition)) issue(["condition"], "Select a crop condition");
        if (!z.string().date().safeParse(data.reportedAt).success) issue(["reportedAt"], "Select a report date");
        const entries = data.cropEntries ?? [];
        if (entries.length !== data.itemIds?.length || new Set(entries.map((entry) => entry.crop)).size !== entries.length
            || entries.some((entry) => !data.itemIds?.includes(entry.crop))) issue(["cropEntries"], "Enter measurements for each selected crop");
        entries.forEach((entry, index) => {
            if (["planted", "destroyed"].includes(data.condition) && entry.quantity === undefined) issue(["cropEntries", index, "quantity"], "Quantity is required");
            if (data.condition === "harvested" && entry.yieldKg === undefined) issue(["cropEntries", index, "yieldKg"], "Harvested yield (kg) is required");
        });
    } else {
        if (!data.items?.length) issue(["items"], "Select at least one item");
        const options = data.entityType === "equipment" ? EQUIPMENT_CONDITION_OPTIONS : LIVESTOCK_HEALTH_OPTIONS;
        const seen = new Set();
        (data.items ?? []).forEach((item, index) => {
            if (seen.has(item.itemId)) issue(["items", index, "itemId"], "Duplicate items are not allowed");
            seen.add(item.itemId);
            if (!options.some((option) => option.value === item.condition)) issue(["items", index, "condition"], "Select a valid condition");
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
