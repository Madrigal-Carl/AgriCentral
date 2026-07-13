import { z } from "zod";

const CONDITIONS = ["healthy", "pregnant", "sick", "deceased"];
const STATUSES = ["assigned", "available"];
const GENDERS = ["male", "female"];

const objectId = (message) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const createLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        tag: z
            .string({ required_error: "Tag is required" })
            .trim()
            .min(1, "Tag is required")
            .max(30, "Tag must not exceed 30 characters")
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
        birthDate: z.coerce.date({ required_error: "Birth date is required" }),
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
    })
    .refine((data) => data.status !== "assigned" || !!data.assignedFarmer, {
        message: "assignedFarmer is required when status is 'assigned'",
        path: ["assignedFarmer"],
    });

export const updateLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        tag: z
            .string()
            .trim()
            .min(1, "Tag is required")
            .max(30, "Tag must not exceed 30 characters")
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
        birthDate: z.coerce.date().optional(),
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
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    })
    .refine(
        (data) =>
            data.status !== "assigned" ||
            (data.assignedFarmer !== undefined && data.assignedFarmer !== null),
        {
            message: "assignedFarmer is required when setting status to 'assigned'",
            path: ["assignedFarmer"],
        },
    )
    .refine(
        (data) =>
            data.status !== "available" ||
            data.assignedFarmer === undefined ||
            data.assignedFarmer === null,
        {
            message: "assignedFarmer must be cleared when setting status to 'available'",
            path: ["assignedFarmer"],
        },
    );

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