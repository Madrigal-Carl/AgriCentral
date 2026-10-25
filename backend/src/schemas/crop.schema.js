import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";

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
    cropType: referenceIdSchema,
    quantity: z.coerce
        .number({ invalid_type_error: "Quantity must be a number" })
        .min(0, "Quantity cannot be negative")
        .optional()
        .default(0),
    assignedFarmer: requiredObjectId("Invalid farmer id", "Assigned farmer is required"),
});

export const updateCropSchema = z.object({
    associationId: requiredObjectId("Invalid association id", "Association is required").optional(),
    cropType: referenceIdSchema.optional(),
    quantity: z.coerce
        .number({ invalid_type_error: "Quantity must be a number" })
        .min(0, "Quantity cannot be negative")
        .optional(),
    assignedFarmer: requiredObjectId("Invalid farmer id", "Assigned farmer is required").optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});

export const cropIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid crop id"),
});

export const getCropsQuerySchema = z.object({
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
