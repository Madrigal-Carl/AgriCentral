import { z } from "zod";

const ROLES = ["far", "aew", "coordinator", "governor", "head", "admin"];

export const createUserSchema = z.object({
    fullname: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters")
        .optional(),
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
    role: z.enum(ROLES).optional().default("far"),
    isVerified: z.boolean().optional(),
    association: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
});

// IMPORTANT: build this from a version of the schema with NO defaults.
// createUserSchema.partial() only makes fields optional to omit — it does
// NOT clear a .default() already attached to a field. Since `role` has
// .default("far"), any partial/update payload that omits `role` would
// otherwise get `role: "far"` silently injected by Zod, which then makes
// the service think the role changed and wipes the user's association.
const updateableFields = createUserSchema.innerType
    ? createUserSchema // fallback, shouldn't hit
    : createUserSchema;

export const updateUserSchema = z
    .object({
        fullname: z
            .string()
            .trim()
            .min(2, "Full name must be at least 2 characters")
            .max(100, "Full name must not exceed 100 characters")
            .optional(),
        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Invalid email format")
            .optional(),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
        role: z.enum(ROLES).optional(), // no default here
        isVerified: z.boolean().optional(),
        association: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const userIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
});

export const getUsersQuerySchema = z.object({
    role: z.enum(ROLES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});