import { z } from "zod";

const SEVERITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["livestock", "equipment"];
const OVERALL_STATUSES = ["pending", "approved", "denied"];
const STAGES = ["coordinator", "governor", "head"];
const APPROVAL_DECISIONS = ["approved", "denied"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

// association is never accepted from the client — see request.service.js,
// it's always derived server-side from the authenticated (far) user.
export const createRequestSchema = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .min(2, "Title must be at least 2 characters")
        .max(100, "Title must not exceed 100 characters"),
    severity: z.enum(SEVERITIES).optional().default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Entity type is required" }),
    lines: z
        .array(z.object({
            key: z.string().trim().min(1, "Select a name/type").max(200),
            quantity: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
        }))
        .min(1, "Select at least one name/type")
        .refine((arr) => new Set(arr.map((line) => line.key)).size === arr.length, {
            message: "Duplicate names/types are not allowed",
        }),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
});

export const updateRequestSchema = createRequestSchema
    .partial()
    .extend({ severity: z.enum(SEVERITIES).optional() })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const updateRequestApprovalSchema = z
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
            message: "Remarks are required when denying a request (at least 5 characters)",
            path: ["remarks"],
        },
    );

export const requestIdParamSchema = z.object({
    id: objectId("Invalid request id"),
});

export const getRequestsQuerySchema = z.object({
    status: z.enum(OVERALL_STATUSES).optional(),
    severity: z.enum(SEVERITIES).optional(),
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

export const revertRequestApprovalSchema = z.object({
    status: z.enum(APPROVAL_DECISIONS),
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500, "Reason must not exceed 500 characters"),
});
