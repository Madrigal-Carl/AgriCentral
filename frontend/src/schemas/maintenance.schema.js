import { z } from "zod";

export const referenceIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Select an item");
export const maintenanceFormSchema = (parent) => z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  ...(parent ? { [parent]: referenceIdSchema } : {}),
});
