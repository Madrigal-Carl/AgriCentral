import express from "express";
import {
    createFarmerHandler,
    updateFarmerHandler,
    deleteFarmerHandler,
    getFarmersHandler,
    getFarmersByAssociationIdHandler,
    getCropsByFarmerIdHandler,
} from "../controllers/farmer.controller.js";
import {
    validateCreateFarmer,
    validateUpdateFarmer,
    validateFarmerIdParam,
    validateFarmerAssociationIdParam,
    validateGetFarmersQuery,
} from "../validators/farmer.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "admin"), scopeByAssociationId, validateGetFarmersQuery, getFarmersHandler);
router.get("/:associationId", authenticated, allowRoles("far", "aew", "coordinator", "admin"), validateFarmerAssociationIdParam, getFarmersByAssociationIdHandler);
router.get("/:id/crops", authenticated, allowRoles("far", "aew", "coordinator", "admin"), validateFarmerIdParam, getCropsByFarmerIdHandler);
router.post("/", authenticated, allowRoles("far", "aew", "coordinator", "admin"), validateCreateFarmer, createFarmerHandler);
router.patch("/:id", authenticated, allowRoles("far", "aew", "coordinator", "admin"), validateFarmerIdParam, validateUpdateFarmer, updateFarmerHandler);
router.delete("/:id", authenticated, allowRoles("far", "aew", "coordinator", "admin"), validateFarmerIdParam, deleteFarmerHandler);

export default router;