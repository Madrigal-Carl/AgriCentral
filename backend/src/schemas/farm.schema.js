import { z } from "zod";

const CROP_STATUSES = [
    "planted",
    "growing",
    "withered",
    "harvested",
    "destroyed",
];

const objectId = (label) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label}`);

const farmCropSchema = z.object({
    crop: objectId("crop id"),
    status: z.enum(CROP_STATUSES).optional().default("planted"),
    yield: z.coerce.number().min(0).optional().default(0),
});

export const createFarmSchema = z.object({
    tag: z
        .string({ required_error: "Tag is required" })
        .trim()
        .min(1, "Tag is required")
        .max(30, "Tag must not exceed 30 characters")
        .transform((v) => v.toUpperCase()),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    assignedFarmers: z.array(objectId("farmer id")).optional().default([]),
    crops: z.array(farmCropSchema).optional().default([]),
    latitude: z.coerce.number({
        required_error: "Latitude is required",
        invalid_type_error: "Latitude must be a number",
    }).min(-90).max(90),
    longitude: z.coerce.number({
        required_error: "Longitude is required",
        invalid_type_error: "Longitude must be a number",
    }).min(-180).max(180),
});

export const updateFarmSchema = createFarmSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const farmIdParamSchema = z.object({
    id: objectId("farm id"),
});

export const getFarmsQuerySchema = z.object({
    search: z.string().trim().min(1).max(100).optional(),
    crop: z.string().trim().min(1).max(100).optional(),
    userId: objectId("user id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});