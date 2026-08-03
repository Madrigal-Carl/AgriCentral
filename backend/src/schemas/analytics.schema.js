import { z } from "zod";

export const getAnalyticsQuerySchema = z.object({
    association: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
    period: z.enum(["week", "month", "year"]).optional().default("month"),
});

export const exportAnalyticsPdfQuerySchema = getAnalyticsQuerySchema.extend({
    section: z.enum(["equipment", "livestock", "farm", "all"]).optional().default("all"),
});