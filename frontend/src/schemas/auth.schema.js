import { z } from "zod";

export const authSchema = z.object({
    email: z
        .string({
            required_error: "Email is required",
        })
        .email("Invalid email format"),
    password: z
        .string({
            required_error: "Password is required",
        })
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must not exceed 100 characters"),
});