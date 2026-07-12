import express from "express";
import {
    createCropHandler,
    updateCropHandler,
    deleteCropHandler,
    getCropsHandler,
    getCropsByUserIdHandler,
} from "../controllers/crop.controller.js";
import {
    validateCreateCrop,
    validateUpdateCrop,
    validateCropIdParam,
    validateCropUserIdParam,
    validateGetCropsQuery,
} from "../validators/crop.validator.js";
import { authenticated, scopeByUserId } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.get("/", authenticated, scopeByUserId, validateGetCropsQuery, getCropsHandler);
router.get("/:userId", authenticated, validateCropUserIdParam, getCropsByUserIdHandler);
router.post("/", authenticated, validateCreateCrop, createCropHandler);
router.patch("/:id", authenticated, validateCropIdParam, validateUpdateCrop, updateCropHandler);
router.delete("/:id", authenticated, validateCropIdParam, deleteCropHandler);

export default router;