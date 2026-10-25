import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "../utils/meaningfulName.js";
import { REPORT_CONDITIONS } from "../utils/reportItems.js";

const SEVERITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["farm", "livestock", "equipment"];
const OVERALL_STATUSES = ["pending", "approved", "denied"];
const STAGES = ["far", "aew", "coordinator"];
const APPROVAL_DECISIONS = ["approved", "denied"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

const attachmentSchema = z.object({
    url: z.string().trim().url("Invalid attachment URL"),
    publicId: z.string().trim().min(1, "Missing attachment public id"),
    resourceType: z.enum(["image", "raw", "video"]).optional().default("image"),
});

// associationId is optional here: far never sends it (derived from the
// authenticated user in report.service.js), aew must send it.
const baseReportObject = z.object({
    associationId: objectId("Invalid association id").optional(),
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .max(100, "Title must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    severity: z.enum(SEVERITIES).optional().default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Entity type is required" }),
    parentId: objectId("Invalid farm id").optional(),
    condition: z
        .string()
        .trim()
        .optional(),
    itemIds: z
        .array(objectId("Invalid item id"))
        .refine((arr) => new Set(arr).size === arr.length, {
            message: "Duplicate items are not allowed",
        }).optional(),
    items: z.array(z.object({
        itemId: objectId("Invalid item id"),
        condition: z.string().trim().min(1, "Condition is required"),
        severity: z.enum(SEVERITIES).default("medium"),
    })).optional(),
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
        if ((!partial || data.itemIds) && !data.itemIds?.length) issue(["itemIds"], "Select at least one crop");
        if ((!partial || data.condition !== undefined) && !REPORT_CONDITIONS.farm.includes(data.condition)) issue(["condition"], "Select a crop condition");
        if (data.items?.length) issue(["items"], "Use itemIds for farm reports");
    } else if (data.entityType || data.items) {
        if ((!partial || data.items) && !data.items?.length) issue(["items"], "Select at least one item");
        const seen = new Set();
        for (const [index, item] of (data.items ?? []).entries()) {
            if (seen.has(item.itemId)) issue(["items", index, "itemId"], "Duplicate items are not allowed");
            seen.add(item.itemId);
            if (data.entityType && !REPORT_CONDITIONS[data.entityType]?.includes(item.condition)) {
                issue(["items", index, "condition"], "Select a valid condition for this type");
            }
        }
    }
}

export const createReportSchema = baseReportObject.superRefine(refineReportItems);

export const updateReportSchema = baseReportObject
    .partial()
    .extend({ severity: z.enum(SEVERITIES).optional(), attachments: z.array(attachmentSchema).optional() })
    .superRefine((data, ctx) => {
        // Partial updates are checked again against the persisted entity type in the service.
        if (data.entityType || data.items) refineReportItems(data, ctx, true);
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
    date: z.string().date("Invalid report date").optional(),
    timezoneOffset: z.coerce.number().int().min(-840).max(840).optional().default(0),
    status: z.enum(OVERALL_STATUSES).optional(),
    severity: z.enum(SEVERITIES).optional(),
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
