import { authSchema } from "../schemas/auth.schema.js";

export const validateAuth = (req, res, next) => {
    const result = authSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    req.body = result.data;
    next();
};
