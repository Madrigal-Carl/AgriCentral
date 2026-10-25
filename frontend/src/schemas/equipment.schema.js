import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";

const CONDITIONS = ["good", "excellent", "unusable", "damaged", "maintenance"];
const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const equipmentFormSchema = z.object({
    propertyNumber: z
        .string({ required_error: "Property number is required" })
        .trim()
        .min(1, "Property number is required")
        .max(30, "Property number must not exceed 30 characters"),
    equipmentType: referenceIdSchema,
    condition: z.enum(CONDITIONS),
    associationId: z.union([objectId("Invalid association id"), z.literal("")]).optional(),
});

export const equipmentUpdateSchema = equipmentFormSchema.partial();
