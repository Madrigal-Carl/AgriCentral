import { z } from "zod";

export const referenceIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Select a valid item");
const name = z.string().trim().min(1, "Name is required").max(100, "Name must not exceed 100 characters");
export const maintenanceSchemas = {
    municipalities: z.object({ name }),
    barangays: z.object({ name, municipality: referenceIdSchema }),
    crops: z.object({ name }),
    equipments: z.object({ name }),
    animals: z.object({ name }),
    breeds: z.object({ name, animalType: referenceIdSchema }),
    colors: z.object({ name }),
};
export const maintenanceQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    municipality: referenceIdSchema.optional(),
    animalType: referenceIdSchema.optional(),
    includeArchived: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});
export const maintenanceIdSchema = z.object({ id: referenceIdSchema });
export const lookupQuerySchema = z.object({ types: z.string().optional().refine((value) => !value || value.split(",").every((type) => Object.hasOwn(maintenanceSchemas, type)), "Unknown lookup type") });
