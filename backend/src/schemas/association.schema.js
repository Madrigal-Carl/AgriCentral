import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "../utils/meaningfulName.js";

export const createAssociationSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .max(100, "Name must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    municipality: referenceIdSchema,
    barangay: referenceIdSchema,
});

export const updateAssociationSchema = createAssociationSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const associationIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid association id"),
});

export const getAssociationsQuerySchema = z.object({
    search: z.string().trim().min(1).max(100).optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const getAvailableAssociationsQuerySchema = z.object({
    includeId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
});
