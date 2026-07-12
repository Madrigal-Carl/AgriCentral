import express from "express";
import {
    createFarmerHandler,
    updateFarmerHandler,
    deleteFarmerHandler,
    getFarmersHandler,
    getFarmersByUserIdHandler,
} from "../controllers/farmer.controller.js";
import {
    validateCreateFarmer,
    validateUpdateFarmer,
    validateFarmerIdParam,
    validateFarmerUserIdParam,
    validateGetFarmersQuery,
} from "../validators/farmer.validator.js";
import { authenticated, scopeByUserId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByUserId, validateGetFarmersQuery, getFarmersHandler);
router.get("/:userId", authenticated, validateFarmerUserIdParam, getFarmersByUserIdHandler);
router.post("/", authenticated, validateCreateFarmer, createFarmerHandler);
router.patch("/:id", authenticated, validateFarmerIdParam, validateUpdateFarmer, updateFarmerHandler);
router.delete("/:id", authenticated, validateFarmerIdParam, deleteFarmerHandler);

export default router;