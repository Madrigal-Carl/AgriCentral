import { z } from "zod";

export const registerSchema = z.object({
    fullname: z
        .string({
            required_error: "Full name is required",
        })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
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

export const loginSchema = z.object({
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