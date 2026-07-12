import { z } from "zod";

export const associationFormSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .min(2, "Association name must be at least 2 characters")
        .max(100, "Association name must not exceed 100 characters"),
    assignedUser: z.string().optional(),
});

// All fields optional — mirrors backend's PATCH semantics (partial update).
export const associationUpdateSchema = associationFormSchema.partial();