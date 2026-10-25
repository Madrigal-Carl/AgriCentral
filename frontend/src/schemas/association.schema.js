import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "@/utils/meaningfulName";

export const associationFormSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .max(100, "Association name must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    municipality: referenceIdSchema,
    barangay: referenceIdSchema,
    assignedUser: z.string().optional(),
});

// All fields optional — mirrors backend's PATCH semantics (partial update).
export const associationUpdateSchema = associationFormSchema.partial();
