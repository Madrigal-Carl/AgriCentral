import {
    getNotificationsQuerySchema,
    notificationIdParamSchema,
} from "../schemas/notification.schema.js";

const validateParams = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    req.params = result.data;
    next();
};

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

export const validateGetNotificationsQuery = validateQuery(getNotificationsQuerySchema);
export const validateNotificationIdParam = validateParams(notificationIdParamSchema);
