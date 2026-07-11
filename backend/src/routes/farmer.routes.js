import express from "express";
import {
    createFarmerHandler,
    updateFarmerHandler,
    deleteFarmerHandler,
    getFarmersHandler,
} from "../controllers/farmer.controller.js";
import {
    validateCreateFarmer,
    validateUpdateFarmer,
    validateFarmerIdParam,
    validateGetFarmersQuery,
} from "../validators/farmer.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetFarmersQuery, getFarmersHandler);
router.post("/", authenticated, validateCreateFarmer, createFarmerHandler);
router.patch("/:id", authenticated, validateFarmerIdParam, validateUpdateFarmer, updateFarmerHandler);
router.delete("/:id", authenticated, validateFarmerIdParam, deleteFarmerHandler);

export default router;