import { z } from "zod";

export const CROP_STATUSES = [
    "planted",
    "growing",
    "withered",
    "harvested",
    "destroyed",
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

const farmCropSchema = z.object({
    crop: z.string().min(1, "Invalid crop"),
    status: z.enum(CROP_STATUSES).optional().default("planted"),
    yield: z.coerce.number().min(0, "Yield cannot be negative").optional().default(0),
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