import express from "express";
import { createFarmerHandler } from "../controllers/farmer.controller.js";
import { validateCreateFarmer } from "../validators/farmer.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticated, validateCreateFarmer, createFarmerHandler);

export default router;