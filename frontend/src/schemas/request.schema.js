import { z } from "zod";

const baseRequestFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(100),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  entityType: z.enum(["livestock", "equipment"]),
  lines: z.array(z.object({
    key: z.string().regex(/^[0-9a-fA-F]{24}$/, "Select an inventory type"),
    quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  })).min(1, "Select at least one name/type").refine(
    (lines) => new Set(lines.map((line) => line.key)).size === lines.length,
    "Duplicate names/types are not allowed",
  ),
  details: z.string().trim().min(10, "Details must be at least 10 characters").max(1000),
});

export const createRequestFormSchema = (availability, previous) => baseRequestFormSchema.superRefine((data, ctx) => {
  if (!availability) return;
  const stock = availability[data.entityType] ?? [];
  data.lines.forEach((line, index) => {
    if (previous?.entityType === data.entityType && previous.lines?.some((item) => item.key === line.key && item.quantity === line.quantity)) return;
    const item = stock.find((entry) => entry.key === line.key);
    const available = item?.available ?? 0;
    if (line.quantity > available) ctx.addIssue({
      code: "custom", path: ["lines", index, "quantity"], message: `Only ${available} ${item?.name ?? "items"} available`,
    });
  });
});
export const createRequestUpdateSchema = createRequestFormSchema;
export const requestFormSchema = createRequestFormSchema();
export const requestUpdateSchema = createRequestUpdateSchema();

export const denyRemarksSchema = z.object({
  remarks: z.string().trim().min(5, "Remarks must be at least 5 characters").max(500, "Remarks must not exceed 500 characters"),
});

export const revertRequestApprovalSchema = z.object({
  status: z.enum(["approved", "denied"]),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500, "Reason must not exceed 500 characters"),
});
