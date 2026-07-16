import { z } from "zod";

const ENTITY_TYPES = ["livestock", "equipment"];
const SEVERITIES = ["low", "medium", "high", "critical"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

const baseRequestFormSchema = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .min(2, "Title must be at least 2 characters")
        .max(100, "Title must not exceed 100 characters"),
    severity: z.enum(SEVERITIES).optional().default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Entity type is required" }),
    entityIds: z
        .array(objectId("Invalid item selected"))
        .min(1, "Select at least one item")
        .refine((arr) => new Set(arr).size === arr.length, {
            message: "Duplicate items are not allowed",
        }),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
});

export const createRequestFormSchema = () => baseRequestFormSchema;
export const createRequestUpdateSchema = () => baseRequestFormSchema.partial();
export const requestFormSchema = createRequestFormSchema();
export const requestUpdateSchema = createRequestUpdateSchema();

// Kept separate from the request form schemas above — this validates a
// different form entirely (ReviewConfirmModal's deny reason), not a
// request record. Mirrors the backend's updateRequestApprovalSchema
// rule (remarks required, 5-500 chars, only when denying).
export const denyRemarksSchema = z.object({
    remarks: z
        .string({ required_error: "Please provide a reason for denying this request" })
        .trim()
        .min(5, "Remarks must be at least 5 characters")
        .max(500, "Remarks must not exceed 500 characters"),
});