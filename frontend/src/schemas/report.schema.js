import { z } from "zod";

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
        .min(2, "Title must be at least 2 characters")
        .max(100, "Title must not exceed 100 characters"),
    severity: z.enum(SEVERITIES).default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Select a type" }),
    farm: z.union([objectId("Select a farm"), z.literal("")]).optional(),
    itemIds: z
        .array(objectId("Invalid item"))
        .min(1, "Select at least one item"),
    condition: z
        .string({ required_error: "Condition is required" })
        .min(1, "Condition is required"),
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

// far never sends association (server derives it); aew must pick one.
export function createReportFormSchema(isFar) {
    return baseReportForm
        .refine((data) => data.entityType !== "farm" || !!data.farm, {
            message: "Farm is required for farm reports",
            path: ["farm"],
        })
        .refine((data) => isFar || !!data.association, {
            message: "Association is required",
            path: ["association"],
        });
}

export function createReportUpdateSchema() {
    return baseReportForm
        .partial()
        .refine(
            (data) => !data.entityType || data.entityType !== "farm" || !!data.farm,
            { message: "Farm is required for farm reports", path: ["farm"] },
        );
}