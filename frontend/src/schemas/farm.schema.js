import { z } from "zod";

export const CROP_STATUSES = [
    "planted",
    "growing",
    "withered",
    "harvested",
    "destroyed",
];

const farmCropSchema = z.object({
    crop: z.string().min(1, "Invalid crop"),
    status: z.enum(CROP_STATUSES).optional().default("planted"),
    yield: z.coerce.number().min(0, "Yield cannot be negative").optional().default(0),
});

// Why not z.preprocess(emptyToUndefined, z.coerce.number({ required_error, invalid_type_error })),
// like before: z.coerce.number() re-coerces internally regardless of what
// preprocess hands it. Number(undefined) is NaN, so the "undefined we just
// produced" never actually reaches Zod as undefined — it arrives as NaN,
// which skips required_error entirely and falls back to Zod's default
// "expected number, received NaN" message. Doing the coercion + range check
// ourselves in a single refine means we control every message directly and
// there's no coerce step left to fight with.
const pinCoordinate = (min, max) =>
    z
        .any()
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return Number.isNaN(num) ? undefined : num;
        })
        .refine((num) => num !== undefined, "Pin a location on the map")
        .refine(
            (num) => num === undefined || (num >= min && num <= max),
            `Must be between ${min} and ${max}`,
        );

const latitudeSchema = pinCoordinate(-90, 90);
const longitudeSchema = pinCoordinate(-180, 180);

export const farmFormSchema = z.object({
    tag: z
        .string({ required_error: "Farm tag is required" })
        .trim()
        .min(1, "Farm tag is required")
        .max(30, "Farm tag must not exceed 30 characters"),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    assignedFarmers: z.array(z.string()).optional().default([]),
    crops: z.array(farmCropSchema).optional().default([]),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
});

// All fields optional — mirrors backend's PATCH semantics (partial update).
// .partial() still lets latitude/longitude be omitted entirely on a PATCH,
// but if either IS provided (including as ""), it goes through the same
// transform + refine checks above — so a PATCH can't null out the pin to
// (0, 0) either.
export const farmUpdateSchema = farmFormSchema.partial();