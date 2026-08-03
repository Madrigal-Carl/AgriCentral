import {
    getAnalyticsQuerySchema,
    exportAnalyticsPdfQuerySchema,
} from "../schemas/analytics.schema.js";

const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
    });

    next();
};

export const validateGetAnalyticsQuery = validateQuery(getAnalyticsQuerySchema);
export const validateExportAnalyticsPdfQuery = validateQuery(exportAnalyticsPdfQuerySchema);