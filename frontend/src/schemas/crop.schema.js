import { z } from "zod";

export const cropFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Crop name must be at least 2 characters")
        .max(100, "Crop name must not exceed 100 characters"),
    kilo: z
        .preprocess((val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            if (typeof val === "number" && Number.isNaN(val)) return undefined;
            return val;
        }, z.coerce
            .number({ invalid_type_error: "Kilo must be a number" })
            .min(0, "Kilo cannot be negative")
            .transform((v) => Math.round(v * 100) / 100)
            .optional()
        )
        .refine((val) => val !== undefined, {
            message: "Kilogram is required",
        }),
    assignedFarmer: z.string().min(1, "Assigned farmer is required"),
});

export const cropUpdateSchema = cropFormSchema.partial();