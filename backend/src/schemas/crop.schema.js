import { z } from "zod";

const STATUSES = ["planted", "not_planted"];

const objectIdOrEmpty = (message) =>
    z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().regex(/^[0-9a-fA-F]{24}$/, message).optional(),
    );

const requiredObjectId = (invalidMessage, requiredMessage) =>
    z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string({ required_error: requiredMessage }).regex(/^[0-9a-fA-F]{24}$/, invalidMessage),
    );

export const createCropSchema = z.object({
    associationId: requiredObjectId("Invalid association id", "Association is required"),
    name: z
        .string({ required_error: "Crop name is required" })
        .trim()
        .min(2, "Crop name must be at least 2 characters")
        .max(100, "Crop name must not exceed 100 characters"),
    kilo: z.coerce
        .number({ invalid_type_error: "Kilo must be a number" })
        .min(0, "Kilo cannot be negative")
        .optional()
        .default(0),
    assignedFarmer: requiredObjectId("Invalid farmer id", "Assigned farmer is required"),
    status: z.enum(STATUSES).optional().default("not_planted"),
});

export const updateCropSchema = z.object({
    associationId: requiredObjectId("Invalid association id", "Association is required").optional(),
    name: z
        .string()
        .trim()
        .min(2, "Crop name must be at least 2 characters")
        .max(100, "Crop name must not exceed 100 characters")
        .optional(),
    kilo: z.coerce
        .number({ invalid_type_error: "Kilo must be a number" })
        .min(0, "Kilo cannot be negative")
        .optional(),
    assignedFarmer: requiredObjectId("Invalid farmer id", "Assigned farmer is required").optional(),
    status: z.enum(STATUSES).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});

export const cropIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid crop id"),
});

export const getCropsQuerySchema = z.object({
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    associationId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const cropFarmIdParamSchema = z.object({
    farmId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid farm id"),
});