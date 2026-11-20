import { z } from "zod";

const emailSchema = z
  .string({
    required_error: "Email is required",
  })
  .email("Invalid email format");

const passwordSchema = z
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
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional().default(false),
});

// Password reset: emails are normalized so Valkey keys and lookups match
// the lowercase address stored on the user.
const resetEmailSchema = z
  .string({
    required_error: "Email is required",
  })
  .trim()
  .toLowerCase()
  .email("Invalid email format");

export const forgotPasswordSchema = z.object({
  email: resetEmailSchema,
});

export const verifyOtpSchema = z.object({
  email: resetEmailSchema,
  otp: z
    .string({
      required_error: "Code is required",
    })
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const resetPasswordSchema = z
  .object({
    email: resetEmailSchema,
    resetToken: z
      .string({
        required_error: "Reset token is required",
      })
      .regex(/^[0-9a-f]{64}$/, "Invalid reset token"),
    password: passwordSchema,
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
