import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";

export const cropFormSchema = z.object({
    cropType: referenceIdSchema,
    quantity: z
        .preprocess((val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            if (typeof val === "number" && Number.isNaN(val)) return undefined;
            return val;
        }, z.coerce
            .number({ invalid_type_error: "Quantity must be a number" })
            .min(0, "Quantity cannot be negative")
            .transform((v) => Math.round(v * 100) / 100)
            .optional()
        )
        .refine((val) => val !== undefined, {
            message: "Quantity is required",
        }),
    assignedFarmer: z
        .string({ required_error: "Assigned farmer is required" })
        .min(1, "Assigned farmer is required"),
    association: z
        .string({ required_error: "Association is required" })
        .min(1, "Association is required"),
});

export const cropUpdateSchema = cropFormSchema.partial();
