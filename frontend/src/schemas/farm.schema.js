import { z } from "zod";
import { referenceIdSchema } from "./maintenance.schema.js";
import { stageQuantityTotal } from "@/constants/data";

export const FARMER_CLASSIFICATIONS = [
    "owner",
    "tenant",
    "lessee",
    "caretaker",
    "farm_worker",
    "co_owner",
    "beneficiary",
];

export const FARMER_CLASSIFICATION_OPTIONS = [
    { value: "owner", label: "Owner" },
    { value: "tenant", label: "Tenant" },
    { value: "lessee", label: "Lessee" },
    { value: "caretaker", label: "Caretaker" },
    { value: "farm_worker", label: "Farm Worker" },
    { value: "co_owner", label: "Co-Owner" },
    { value: "beneficiary", label: "Beneficiary" },
];

const cropQuantityFieldSchema = z
    .union([z.null(), z.coerce.number().min(0, "Cannot be negative")])
    .optional()
    .default(null);

// Newly planted is derived (planted minus the five stages) and never sent.
// Anything else the form carries per crop row (ownership for the badge) is
// not declared here, so zod's default "strip" keeps it out of the payload.
const farmCropSchema = z.object({
    _id: z.string().optional(),
    crop: z.string().min(1, "Invalid crop"),
    quantities: z
        .object({
            planted: cropQuantityFieldSchema,
            flowering: cropQuantityFieldSchema,
            reproductive: cropQuantityFieldSchema,
            vegetative: cropQuantityFieldSchema,
            harvested: cropQuantityFieldSchema,
            damaged: cropQuantityFieldSchema,
        })
        .superRefine((quantities, ctx) => {
            if (stageQuantityTotal(quantities) > (quantities.planted ?? 0)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["planted"],
                    message: "Stage quantities cannot exceed the planted quantity",
                });
            }
        })
        .optional()
        .default({}),
});

const farmFarmerSchema = z.object({
    farmer: z.string().min(1, "Invalid farmer"),
    classification: z.enum(FARMER_CLASSIFICATIONS).optional().default("owner"),
});

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

const sizeSchema = z
    .any()
    .transform((val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = Number(val);
        return Number.isNaN(num) ? undefined : num;
    })
    .refine((num) => num !== undefined, "Size is required")
    .refine((num) => num === undefined || num >= 0, "Size must not be negative");

export const farmFormSchema = z.object({
    municipality: referenceIdSchema,
    barangay: referenceIdSchema,
    street: z.string().trim().max(200).optional(),
    size: sizeSchema,
    assignedFarmers: z.array(farmFarmerSchema).optional().default([]),
    association: z.string().optional().default(""),
    crops: z.array(farmCropSchema).optional().default([]),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
});

export const farmUpdateSchema = farmFormSchema.partial();
