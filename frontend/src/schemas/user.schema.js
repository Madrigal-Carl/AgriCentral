import { z } from "zod";

export const ROLES = ["far", "aew", "coordinator", "governor", "head", "admin"];

export const userFormSchema = z.object({
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
    association: z.string().optional(),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
});

// Password is only conditionally sent on edit (see UserModal), so it's kept
// optional here — validation still runs on it when a reset actually occurs.
export const userUpdateSchema = userFormSchema
    .extend({
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
    })
    .partial();