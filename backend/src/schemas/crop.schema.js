import { z } from "zod";

const STATUSES = ["planted", "not_planted"];

export const createCropSchema = z.object({
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
        .optional(),
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
    assignedFarmer: z
        .string({ required_error: "Assigned farmer is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid farmer id"),
    status: z.enum(STATUSES).optional().default("not_planted"),
});

export const updateCropSchema = createCropSchema
    .omit({ userId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const cropIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid crop id"),
});

export const getCropsQuerySchema = z.object({
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
        .optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const cropUserIdParamSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
});