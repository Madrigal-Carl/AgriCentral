import { z } from "zod";

const emailRule = z
    .string({
        required_error: "Email is required",
    })
    .email("Invalid email format");

const passwordRule = z
    .string({
        required_error: "Password is required",
    })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters");

export const registerSchema = z.object({
    fullname: z
        .string({
            required_error: "Full name is required",
        })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
    email: emailRule,
    password: passwordRule,
});

export const loginSchema = z.object({
    email: emailRule,
    password: passwordRule,
    rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
    email: z
        .string({
            required_error: "Email is required",
        })
        .trim()
        .min(1, "Email is required")
        .email("Invalid email format"),
});

export const resetPasswordSchema = z
    .object({
        password: passwordRule,
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
