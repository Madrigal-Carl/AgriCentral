import express from "express";
import {
    createCropHandler,
    updateCropHandler,
    deleteCropHandler,
    getCropsHandler,
    getCropsByFarmIdHandler,
} from "../controllers/crop.controller.js";
import {
    validateCreateCrop,
    validateUpdateCrop,
    validateCropIdParam,
    validateCropFarmIdParam,
    validateGetCropsQuery,
} from "../validators/crop.validator.js";
import { authenticated, scopeByUserId } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.get("/", authenticated, scopeByUserId, validateGetCropsQuery, getCropsHandler);
router.get("/:farmId", authenticated, validateCropFarmIdParam, getCropsByFarmIdHandler);
router.post("/", authenticated, validateCreateCrop, createCropHandler);
router.patch("/:id", authenticated, validateCropIdParam, validateUpdateCrop, updateCropHandler);
router.delete("/:id", authenticated, validateCropIdParam, deleteCropHandler);

export default router;