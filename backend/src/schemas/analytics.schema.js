import { z } from "zod";
import { currentYear, normalizePeriod } from "../utils/dateRange.util.js";

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const MIN_ANALYTICS_YEAR = 2000;

const analyticsQueryObject = z.object({
    association: objectId("Invalid association id").optional(),
    // Scopes every query to one farmer (combined with association if both).
    farmer: objectId("Invalid farmer id").optional(),
    period: z.enum(["week", "month", "year"]).optional().default("month"),
    // Defaults to the current year; future years are rejected.
    year: z.coerce
        .number({ error: "Year must be a number" })
        .int("Year must be a whole number")
        .min(MIN_ANALYTICS_YEAR, `Year must be ${MIN_ANALYTICS_YEAR} or later`)
        .refine((year) => year <= currentYear(), "Year cannot be in the future")
        .default(currentYear),
});

// Past years only support the whole-year period.
const withNormalizedPeriod = (schema) =>
    schema.transform((data) => ({ ...data, period: normalizePeriod(data.period, data.year) }));

export const getAnalyticsQuerySchema = withNormalizedPeriod(analyticsQueryObject);

const exportQueryObject = analyticsQueryObject.extend({
    section: z.enum(["equipment", "livestock", "farm", "all"]).optional().default("all"),
});

export const exportAnalyticsPdfQuerySchema = withNormalizedPeriod(exportQueryObject);

export const exportAnalyticsExcelQuerySchema = exportAnalyticsPdfQuerySchema;

// Farmer filter options, optionally limited to one association.
export const getAnalyticsFarmersQuerySchema = z.object({
    association: objectId("Invalid association id").optional(),
});
