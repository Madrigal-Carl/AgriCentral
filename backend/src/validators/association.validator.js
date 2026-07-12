import {
    createAssociationSchema,
    updateAssociationSchema,
    associationIdParamSchema,
    getAssociationsQuerySchema,
} from "../schemas/association.schema.js";

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

    // req.query is a getter-only property in newer Express/Node — can't
    // reassign it directly, so redefine it instead.
    Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
    });

    next();
};

export const validateCreateAssociation = validate(createAssociationSchema);
export const validateUpdateAssociation = validate(updateAssociationSchema);
export const validateAssociationIdParam = validateParams(associationIdParamSchema);
export const validateGetAssociationsQuery = validateQuery(getAssociationsQuerySchema);