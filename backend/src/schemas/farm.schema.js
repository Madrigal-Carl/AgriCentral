import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { stageQuantityTotal } from "../utils/cropStages.js";

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

// Newly planted is derived (planted minus the five stages) and never sent.
const cropQuantitiesSchema = z.object({
    planted: cropQuantityField,
    flowering: cropQuantityField,
    reproductive: cropQuantityField,
    vegetative: cropQuantityField,
    harvested: cropQuantityField,
    damaged: cropQuantityField,
}).superRefine((quantities, ctx) => {
    const staged = stageQuantityTotal(quantities);
    if (staged > (quantities.planted ?? 0)) {
        ctx.addIssue({
            code: "custom",
            path: ["planted"],
            message: `Stage quantities (${staged}) cannot exceed the planted quantity (${quantities.planted ?? 0})`,
        });
    }
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
    municipality: referenceIdSchema,
    barangay: referenceIdSchema,
    street: z.string().trim().max(200).optional(),
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
    // One record by id (opening a notification's record); role scoping still applies.
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid record id").optional(),
    search: z.string().trim().min(1).max(100).optional(),
    crop: referenceIdSchema.optional(),
    associationId: objectId("association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});
