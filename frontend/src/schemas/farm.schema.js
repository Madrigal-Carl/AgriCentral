import { z } from "zod";

export const CROP_STATUSES = [
    "planted",
    "growing",
    "withered",
    "harvested",
    "damaged",
];

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

// No `status` key here. The form still carries a local `status` value per
// crop row (purely to drive which quantity input is shown/editable), but
// since it's not declared in this schema, zod's default "strip" behavior
// removes it from the parsed values react-hook-form hands to onSubmit —
// it never reaches the API payload.
const farmCropSchema = z.object({
    _id: z.string().optional(),
    crop: z.string().min(1, "Invalid crop"),
    quantities: z
        .object({
            planted: cropQuantityFieldSchema,
            growing: cropQuantityFieldSchema,
            withered: cropQuantityFieldSchema,
            harvested: cropQuantityFieldSchema,
            damaged: cropQuantityFieldSchema,
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
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    size: sizeSchema,
    assignedFarmers: z.array(farmFarmerSchema).optional().default([]),
    association: z.string().optional().default(""),
    crops: z.array(farmCropSchema).optional().default([]),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
});

export const farmUpdateSchema = farmFormSchema.partial();