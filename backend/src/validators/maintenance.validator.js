import { maintenanceSchemas, maintenanceQuerySchema, maintenanceIdSchema, lookupQuerySchema } from "../schemas/maintenance.schema.js";

const validate = (schema, source) => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return res.status(400).json({ message: "Validation error", errors: result.error.issues });
    Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true, enumerable: true });
    next();
};

export const validateMaintenanceBody = (type, update = false) => validate(update ? maintenanceSchemas[type].partial().refine((value) => Object.keys(value).length > 0, "At least one field must be provided") : maintenanceSchemas[type], "body");
export const validateMaintenanceQuery = validate(maintenanceQuerySchema, "query");
export const validateMaintenanceId = validate(maintenanceIdSchema, "params");
export const validateLookupQuery = validate(lookupQuerySchema, "query");
