import { z } from "zod";

export const ROLES = ["far", "aew", "coordinator", "governor", "head", "admin"];

const baseUserFormSchema = z.object({
    fullname: z
        .string({ required_error: "Full name is required" })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
    email: z
        .string({ required_error: "Email address is required" })
        .trim()
        .toLowerCase()
        .email("Invalid email format"),
    role: z.enum(ROLES, { required_error: "Role is required" }).default("far"),
    // Backend sends null when there's no association (see formatUser),
    // and the form can also start with "" — accept all three "empty"
    // shapes here so only the superRefine below decides if it's required.
    association: z.string().nullable().optional(),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
});

export const userFormSchema = baseUserFormSchema.superRefine((data, ctx) => {
    if (data.role === "far" && !data.association) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Association is required for FAR users",
            path: ["association"],
        });
    }
});

// Password is only conditionally sent on edit (see UserModal), so it's kept
// optional here — validation still runs on it when a reset actually occurs.
// Built from the base (pre-refine) schema since .extend() isn't available
// after superRefine — the association-required rule is re-applied below.
export const userUpdateSchema = baseUserFormSchema
    .extend({
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
    })
    .partial()
    .superRefine((data, ctx) => {
        if (data.role === "far" && !data.association) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Association is required for FAR users",
                path: ["association"],
            });
        }
    });