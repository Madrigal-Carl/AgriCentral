import { z } from "zod";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";

const GENDERS = GENDER_OPTIONS.map((o) => o.value);
const HEALTH_STATUSES = LIVESTOCK_HEALTH_OPTIONS.map((o) => o.value);
const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const livestockFormSchema = z.object({
    tag: z
        .string({ required_error: "Tag is required" })
        .trim()
        .min(1, "Tag is required")
        .max(30, "Tag must not exceed 30 characters"),
    animal: z
        .string({ required_error: "Animal type is required" })
        .trim()
        .min(2, "Animal type must be at least 2 characters")
        .max(50, "Animal type must not exceed 50 characters"),
    breed: z
        .string({ required_error: "Breed is required" })
        .trim()
        .min(2, "Breed must be at least 2 characters")
        .max(50, "Breed must not exceed 50 characters"),
    gender: z.enum(GENDERS),
    health: z.enum(HEALTH_STATUSES),
    dob: z
        .string({ required_error: "Date of birth is required" })
        .trim()
        .min(1, "Date of birth is required"),
    color: z
        .string({ required_error: "Color is required" })
        .trim()
        .min(1, "Color is required")
        .max(50, "Color must not exceed 50 characters"),
    weight: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.union([z.number(), z.string()]).optional(),
    ).transform((val, ctx) => {
        if (val === undefined) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight is required" });
            return z.NEVER;
        }
        const num = typeof val === "number" ? val : Number(val);
        if (Number.isNaN(num)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight must be a number" });
            return z.NEVER;
        }
        if (num < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight must be zero or greater" });
            return z.NEVER;
        }
        return num;
    }),
    associationId: z.union([objectId("Invalid association id"), z.literal("")]).optional(),
});

export const livestockUpdateSchema = livestockFormSchema.partial();