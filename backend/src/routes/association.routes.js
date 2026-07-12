import express from "express";
import {
    createAssociationHandler,
    updateAssociationHandler,
    deleteAssociationHandler,
    getAssociationsHandler,
} from "../controllers/association.controller.js";
import {
    validateCreateAssociation,
    validateUpdateAssociation,
    validateAssociationIdParam,
    validateGetAssociationsQuery,
} from "../validators/association.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetAssociationsQuery, getAssociationsHandler);
router.post("/", authenticated, validateCreateAssociation, createAssociationHandler);
router.patch("/:id", authenticated, validateAssociationIdParam, validateUpdateAssociation, updateAssociationHandler);
router.delete("/:id", authenticated, validateAssociationIdParam, deleteAssociationHandler);

export default router;