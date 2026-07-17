import { z } from "zod";

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
        .min(2, "Title must be at least 2 characters")
        .max(100, "Title must not exceed 100 characters"),
    severity: z.enum(SEVERITIES).optional().default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Entity type is required" }),
    parentId: objectId("Invalid farm id").optional(),
    condition: z
        .string({ required_error: "Condition is required" })
        .trim()
        .min(1, "Condition is required"),
    itemIds: z
        .array(objectId("Invalid item id"))
        .min(1, "Select at least one item")
        .refine((arr) => new Set(arr).size === arr.length, {
            message: "Duplicate items are not allowed",
        }),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
    attachments: z.array(attachmentSchema).optional().default([]),
});

export const createReportSchema = baseReportObject.refine(
    (data) => data.entityType !== "farm" || !!data.parentId,
    {
        message: "parentId (farm) is required for farm reports",
        path: ["parentId"],
    },
);

export const updateReportSchema = baseReportObject
    .partial()
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