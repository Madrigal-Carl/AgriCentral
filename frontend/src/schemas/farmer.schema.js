import { z } from "zod";

export const POSITIONS = [
    "president",
    "vice_president",
    "secretary",
    "treasurer",
    "auditor",
    "pio",
    "project_manager",
    "director",
    "member",
];

export const farmerFormSchema = z.object({
    name: z
        .string({ required_error: "Full name is required" })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
    contact: z
        .string({ required_error: "Contact number is required" })
        .trim()
        .min(7, "Contact number is too short")
        .max(20, "Contact number is too long"),
    email: z
        .string({ required_error: "Email address is required" })
        .trim()
        .toLowerCase()
        .email("Invalid email format"),
    gender: z.enum(["male", "female"], {
        required_error: "Gender is required",
    }),
    dob: z
        .string({ required_error: "Birth date is required" })
        .min(1, "Birth date is required"),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    position: z.enum(POSITIONS).optional().default("member"),
    association: z.string().optional(),
    farms: z.array(z.string()).optional().default([]),
    livestock: z.array(z.string()).optional().default([]),
    equipment: z.array(z.string()).optional().default([]),
    // Files are local File objects at this stage — uploaded separately, not validated by shape here.
    files: z.array(z.any()).optional().default([]),
});