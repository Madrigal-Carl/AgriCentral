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
import { authenticated, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByAssociationId, validateGetFarmersQuery, getFarmersHandler);
router.get("/:associationId", authenticated, validateFarmerAssociationIdParam, getFarmersByAssociationIdHandler);
router.get("/:id/crops", authenticated, validateFarmerIdParam, getCropsByFarmerIdHandler);
router.post("/", authenticated, validateCreateFarmer, createFarmerHandler);
router.patch("/:id", authenticated, validateFarmerIdParam, validateUpdateFarmer, updateFarmerHandler);
router.delete("/:id", authenticated, validateFarmerIdParam, deleteFarmerHandler);

export default router;