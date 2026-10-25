import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";

const CONDITIONS = ["healthy", "pregnant", "sick", "injured", "deceased"];
const STATUSES = ["assigned", "available"];
const GENDERS = ["male", "female"];

const objectId = (message) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const createLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        propertyNumber: z
            .string({ required_error: "Property number is required" })
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase(),
        animalType: referenceIdSchema,
        breed: referenceIdSchema,
        gender: z.enum(GENDERS, { required_error: "Gender is required" }),
        birthDate: z.coerce.date({ error: "Invalid release date" }),
        color: referenceIdSchema,
        weight: z.coerce
            .number({ required_error: "Weight is required" })
            .min(0, "Weight must not be negative")
            .default(0),
        condition: z.enum(CONDITIONS).optional().default("healthy"),
        status: z.enum(STATUSES).optional().default("available"),
        assignedFarmer: objectId("Invalid farmer id").optional(),
        mother: objectId("Invalid mother id").nullable().optional(),
    })
    .refine((data) => !(data.associationId || data.assignedFarmer) || !BLOCKED_CONDITIONS.livestock.includes(data.condition), {
        message: "Not assignable: livestock is deceased, injured, or sick",
        path: ["associationId"],
    });

export const updateLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").nullable().optional(),
        propertyNumber: z
            .string()
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase()
            .optional(),
        animalType: referenceIdSchema.optional(),
        breed: referenceIdSchema.optional(),
        gender: z.enum(GENDERS).optional(),
        birthDate: z.coerce.date({ error: "Invalid release date" }).optional(),
        color: referenceIdSchema.optional(),
        weight: z.coerce.number().min(0, "Weight must not be negative").optional(),
        condition: z.enum(CONDITIONS).optional(),
        status: z.enum(STATUSES).optional(),
        // null clears the assignment (return to available); a string
        // assigns/reassigns; omitted leaves it untouched.
        assignedFarmer: objectId("Invalid farmer id").nullable().optional(),
        mother: objectId("Invalid mother id").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const livestockIdParamSchema = z.object({
    id: objectId("Invalid livestock id"),
});

export const getLivestocksQuerySchema = z.object({
    condition: z.enum(CONDITIONS).optional(),
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    associationId: objectId("Invalid association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const getLivestockMothersQuerySchema = z.object({
    animalType: referenceIdSchema,
    associationId: objectId("Invalid association id").optional(),
    assignedFarmer: objectId("Invalid farmer id").optional(),
    excludeId: objectId("Invalid livestock id").optional(),
});
