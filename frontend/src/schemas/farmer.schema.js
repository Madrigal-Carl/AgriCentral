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

export const STATUSES = ["active", "inactive"];

const baseFarmerFormSchema = z.object({
    lastName: z
        .string({ required_error: "Last name is required" })
        .trim()
        .min(1, "Last name is required")
        .max(50, "Last name must not exceed 50 characters"),
    firstName: z
        .string({ required_error: "First name is required" })
        .trim()
        .min(1, "First name is required")
        .max(50, "First name must not exceed 50 characters"),
    middleName: z
        .string()
        .trim()
        .max(50, "Middle name must not exceed 50 characters")
        .optional(),
    contact: z
        .string({ required_error: "Contact number is required" })
        .trim()
        .min(7, "Contact number is too short")
        .max(20, "Contact number is too long"),
    // Optional to mirror the backend, which does not require emailAddress.
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email format")
        .optional()
        .or(z.literal("")),
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
    // Backend may send null for an unset association (see toFormShape),
    // and the form can also start with "" — accept all three "empty"
    // shapes here; whether it's actually required is decided below,
    // since that depends on the creator's role, not the field itself.
    association: z.string().nullable().optional(),
    farms: z.array(z.any()).optional().default([]),
    livestock: z.array(z.any()).optional().default([]),
    equipment: z.array(z.any()).optional().default([]),
    files: z.array(z.any()).optional().default([]),
});

// isFar is passed in from the caller (it comes from useAuth, not from the
// form itself) since a FAR user never sets association — it's resolved
// server-side from their own account — while anyone else must pick one.
export const createFarmerFormSchema = (isFar) =>
    baseFarmerFormSchema.superRefine((data, ctx) => {
        if (!isFar && !data.association) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Association is required",
                path: ["association"],
            });
        }
    });

// All fields optional — mirrors backend's PATCH semantics (partial update).
// For edits, the existing farmer record already has an association, so we
// should not block the form just because the field was not re-selected.
export const createFarmerUpdateSchema = () =>
    baseFarmerFormSchema.extend({
        status: z.enum(STATUSES).optional(),
    }).partial();

// Kept for any other call sites that import the static schema directly
// (e.g. relying on default non-far behavior). Prefer the factory
// functions above wherever the creator's role is known.
export const farmerFormSchema = createFarmerFormSchema(false);
export const farmerUpdateSchema = createFarmerUpdateSchema();