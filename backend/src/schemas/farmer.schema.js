import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";

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

const attachmentSchema = z.object({
    url: z.string().trim().url("Invalid attachment URL"),
    publicId: z.string().trim().min(1, "Missing attachment public id"),
    resourceType: z.enum(["image", "raw", "video"]).optional().default("image"),
});

export const createFarmerSchema = z.object({
    associationId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
    lastName: z
        .string({ required_error: "Last name is required" })
        .trim()
        .min(1, "Last name must be at least 1 character")
        .max(50, "Last name must not exceed 50 characters"),
    firstName: z
        .string({ required_error: "First name is required" })
        .trim()
        .min(1, "First name must be at least 1 character")
        .max(50, "First name must not exceed 50 characters"),
    middleName: z
        .string()
        .trim()
        .max(50, "Middle name must not exceed 50 characters")
        .optional(),
    contactNumber: z
        .string({ error: "Contact number must be 11 digits and start with 09" })
        .trim()
        .regex(/^09\d{9}$/, "Contact number must be 11 digits and start with 09"),
    emailAddress: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email format")
        .optional(),
    gender: z.enum(["male", "female"], {
        required_error: "Gender is required",
    }),
    birthDate: z.coerce.date({
        required_error: "Birth date is required",
        invalid_type_error: "Invalid birth date",
    }),
    municipality: referenceIdSchema,
    barangay: referenceIdSchema,
    street: z.string().trim().max(200).optional(),
    position: z.enum(POSITIONS).optional().default("member"),
    attachments: z.array(attachmentSchema).optional().default([]),
    profileImage: attachmentSchema.extend({ resourceType: z.literal("image").default("image") }).nullable().optional(),
});

export const updateFarmerSchema = createFarmerSchema
    .extend({
        status: z.enum(STATUSES).optional(),
        position: z.enum(POSITIONS).optional(),
        attachments: z.array(attachmentSchema).optional(),
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

export const farmerAssociationIdParamSchema = z.object({
    associationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid association id"),
});
