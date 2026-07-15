import { z } from "zod";

const CONDITIONS = ["good", "excellent", "damaged", "maintenance"];
const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const equipmentFormSchema = z.object({
    propertyNumber: z
        .string({ required_error: "Property number is required" })
        .trim()
        .min(1, "Property number is required")
        .max(30, "Property number must not exceed 30 characters"),
    name: z
        .string({ required_error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
    condition: z.enum(CONDITIONS),
    associationId: z.union([objectId("Invalid association id"), z.literal("")]).optional(),
});

export const equipmentUpdateSchema = equipmentFormSchema.partial();