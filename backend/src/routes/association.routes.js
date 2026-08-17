import express from "express";
import {
    createAssociationHandler,
    updateAssociationHandler,
    deleteAssociationHandler,
    getAssociationsHandler,
    getAvailableAssociationsHandler,
} from "../controllers/association.controller.js";
import {
    validateCreateAssociation,
    validateUpdateAssociation,
    validateAssociationIdParam,
    validateGetAssociationsQuery,
    validateGetAvailableAssociationsQuery,
} from "../validators/association.validator.js";
import { authenticated, allowRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
    "/available",
    authenticated,
    allowRoles("far", "aew", "coordinator", "governor", "head", "admin"),
    validateGetAvailableAssociationsQuery,
    getAvailableAssociationsHandler,
);
router.get(
    "/",
    authenticated,
    allowRoles("far", "aew", "coordinator", "governor", "head", "admin"),
    validateGetAssociationsQuery,
    getAssociationsHandler,
);
router.post("/", authenticated, allowRoles("aew", "coordinator", "admin"), validateCreateAssociation, createAssociationHandler);
router.patch("/:id", authenticated, allowRoles("aew", "coordinator", "admin"), validateAssociationIdParam, validateUpdateAssociation, updateAssociationHandler);
router.delete("/:id", authenticated, allowRoles("aew", "coordinator", "admin"), validateAssociationIdParam, deleteAssociationHandler);

export default router;