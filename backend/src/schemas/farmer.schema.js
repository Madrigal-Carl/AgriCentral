import { z } from "zod";

const POSITIONS = [
    "president",
    "vice_president",
    "secretary",
    "treasurer",
    "auditor",
    "pio",
    "project_manager",
    "director",
    "member",
];

const STATUSES = ["active", "inactive"];

export const createFarmerSchema = z.object({
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
        .optional(),
    fullName: z
        .string({ required_error: "Full name is required" })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
    contactNumber: z
        .string({ required_error: "Contact number is required" })
        .trim()
        .min(7, "Contact number is too short")
        .max(20, "Contact number is too long"),
    emailAddress: z
        .string({ required_error: "Email address is required" })
        .trim()
        .toLowerCase()
        .email("Invalid email format"),
    gender: z.enum(["male", "female"], {
        required_error: "Gender is required",
    }),
    birthDate: z.coerce.date({
        required_error: "Birth date is required",
        invalid_type_error: "Invalid birth date",
    }),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    position: z.enum(POSITIONS).optional().default("member"),
    attachments: z.array(z.string().trim().url("Invalid attachment URL")).optional().default([]),
});

export const updateFarmerSchema = createFarmerSchema
    .omit({ userId: true })
    .extend({
        status: z.enum(STATUSES).optional(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const farmerIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid farmer id"),
});

export const getFarmersQuerySchema = z.object({
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const farmerUserIdParamSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
});