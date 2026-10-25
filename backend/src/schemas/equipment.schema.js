import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";

const CONDITIONS = ["good", "excellent", "damaged", "unusable", "maintenance"];
const STATUSES = ["assigned", "available"];

const objectId = (message) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const createEquipmentSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        propertyNumber: z
            .string({ required_error: "Property number is required" })
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase(),
        equipmentType: referenceIdSchema,
        condition: z.enum(CONDITIONS).optional().default("good"),
        status: z.enum(STATUSES).optional().default("available"),
        assignedFarmer: objectId("Invalid farmer id").optional(),
    })
    .refine((data) => !(data.associationId || data.assignedFarmer) || !BLOCKED_CONDITIONS.equipment.includes(data.condition), {
        message: "Not assignable: equipment is damaged, unusable, or under maintenance",
        path: ["associationId"],
    });

export const updateEquipmentSchema = z
    .object({
        associationId: objectId("Invalid association id").nullable().optional(),
        propertyNumber: z
            .string()
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase()
            .optional(),
        equipmentType: referenceIdSchema.optional(),
        condition: z.enum(CONDITIONS).optional(),
        status: z.enum(STATUSES).optional(),
        // null clears the assignment (return to available); a string
        // assigns/reassigns; omitted leaves it untouched.
        assignedFarmer: objectId("Invalid farmer id").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const equipmentIdParamSchema = z.object({
    id: objectId("Invalid equipment id"),
});

export const getEquipmentsQuerySchema = z.object({
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
