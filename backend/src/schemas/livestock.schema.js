import { z } from "zod";
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
        animal: z
            .string({ required_error: "Animal is required" })
            .trim()
            .min(2, "Animal must be at least 2 characters")
            .max(100, "Animal must not exceed 100 characters"),
        breed: z
            .string({ required_error: "Breed is required" })
            .trim()
            .min(2, "Breed must be at least 2 characters")
            .max(100, "Breed must not exceed 100 characters"),
        gender: z.enum(GENDERS, { required_error: "Gender is required" }),
        birthDate: z.coerce.date({ error: "Invalid release date" }),
        color: z
            .string({ required_error: "Color is required" })
            .trim()
            .min(1, "Color is required")
            .max(50, "Color must not exceed 50 characters"),
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
        animal: z
            .string()
            .trim()
            .min(2, "Animal must be at least 2 characters")
            .max(100, "Animal must not exceed 100 characters")
            .optional(),
        breed: z
            .string()
            .trim()
            .min(2, "Breed must be at least 2 characters")
            .max(100, "Breed must not exceed 100 characters")
            .optional(),
        gender: z.enum(GENDERS).optional(),
        birthDate: z.coerce.date({ error: "Invalid release date" }).optional(),
        color: z
            .string()
            .trim()
            .min(1, "Color is required")
            .max(50, "Color must not exceed 50 characters")
            .optional(),
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
    animal: z.string().trim().min(2, "Enter an animal type").max(100),
    associationId: objectId("Invalid association id").optional(),
    assignedFarmer: objectId("Invalid farmer id").optional(),
    excludeId: objectId("Invalid livestock id").optional(),
});
