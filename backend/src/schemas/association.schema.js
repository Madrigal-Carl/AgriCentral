import { z } from "zod";

export const createAssociationSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
    assignedUser: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
        .optional(),
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