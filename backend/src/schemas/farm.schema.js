import { z } from "zod";

const FARMER_CLASSIFICATIONS = [
    "owner",
    "tenant",
    "lessee",
    "caretaker",
    "farm_worker",
    "co_owner",
    "beneficiary",
];

const objectId = (label) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label}`);

const emptyToUndefined = (val) => (val === "" || val === null ? undefined : val);

const optionalObjectId = (label) =>
    z.preprocess(emptyToUndefined, objectId(label).optional());

const cropQuantityField = z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.union([z.null(), z.coerce.number().min(0)])
).optional().default(null);

const cropQuantitiesSchema = z.object({
    planted: cropQuantityField,
    growing: cropQuantityField,
    withered: cropQuantityField,
    harvested: cropQuantityField,
    damaged: cropQuantityField,
});

const farmCropSchema = z.object({
    _id: optionalObjectId("crop entry id"),
    crop: objectId("crop id"),
    quantities: cropQuantitiesSchema.optional().default({}),
});

const farmFarmerSchema = z.object({
    farmer: objectId("farmer id"),
    classification: z.enum(FARMER_CLASSIFICATIONS).optional().default("owner"),
});

const latitudeSchema = z.preprocess(
    emptyToUndefined,
    z.coerce.number({
        required_error: "Latitude is required",
        invalid_type_error: "Latitude must be a number",
    }).min(-90).max(90),
);

const longitudeSchema = z.preprocess(
    emptyToUndefined,
    z.coerce.number({
        required_error: "Longitude is required",
        invalid_type_error: "Longitude must be a number",
    }).min(-180).max(180),
);

const sizeSchema = z.preprocess(
    emptyToUndefined,
    z.coerce.number({
        required_error: "Size is required",
        invalid_type_error: "Size must be a number",
    }).min(0, "Size must not be negative"),
);

export const createFarmSchema = z.object({
    associationId: optionalObjectId("association id"),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    size: sizeSchema,
    assignedFarmers: z.array(farmFarmerSchema).optional().default([]),
    crops: z.array(farmCropSchema).optional().default([]),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
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
    associationId: objectId("association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});