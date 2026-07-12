import {
    createFarmerSchema,
    updateFarmerSchema,
    farmerIdParamSchema,
    farmerAssociationIdParamSchema,
    getFarmersQuerySchema,
} from "../schemas/farmer.schema.js";

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    req.body = result.data;
    next();
};

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

export const validateCreateFarmer = validate(createFarmerSchema);
export const validateUpdateFarmer = validate(updateFarmerSchema);
export const validateFarmerIdParam = validateParams(farmerIdParamSchema);
export const validateFarmerAssociationIdParam = validateParams(farmerAssociationIdParamSchema);
export const validateGetFarmersQuery = validateQuery(getFarmersQuerySchema);