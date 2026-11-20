import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";

const GENDERS = GENDER_OPTIONS.map((o) => o.value);
const HEALTH_STATUSES = LIVESTOCK_HEALTH_OPTIONS.map((o) => o.value);
const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

const baseLivestockFormSchema = z.object({
    propertyNumber: z
        .string({ required_error: "Property number is required" })
        .trim()
        .min(1, "Property number is required")
        .max(30, "Property number must not exceed 30 characters"),
    animalType: referenceIdSchema,
    breed: referenceIdSchema,
    gender: z.enum(GENDERS),
    health: z.enum(HEALTH_STATUSES),
    dob: z
        .string({ error: "Release date is required" })
        .trim()
        .min(1, "Release date is required"),
    color: referenceIdSchema,
    associationId: z.union([objectId("Invalid association id"), z.literal("")]).optional(),
    isOffspring: z.boolean().optional().default(false),
    mother: z.union([objectId("Select a valid mother"), z.literal("")]).nullable().optional(),
});

function validateMother(data, ctx) {
    if (data.isOffspring && !data.mother) {
        ctx.addIssue({ code: "custom", path: ["mother"], message: "Select a mother when Offspring is enabled" });
    }
}

export const livestockFormSchema = baseLivestockFormSchema.superRefine(validateMother);
export const livestockUpdateSchema = baseLivestockFormSchema.partial().superRefine(validateMother);
