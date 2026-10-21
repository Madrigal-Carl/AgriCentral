import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "@/utils/meaningfulName";

export const associationFormSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .max(100, "Association name must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    municipality: z.string().trim().min(1, "Municipality is required"),
    barangay: z.string().trim().min(1, "Barangay is required"),
    assignedUser: z.string().optional(),
});

// All fields optional — mirrors backend's PATCH semantics (partial update).
export const associationUpdateSchema = associationFormSchema.partial();
