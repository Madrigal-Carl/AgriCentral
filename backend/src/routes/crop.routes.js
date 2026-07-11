import express from "express";
import {
    createCropHandler,
    updateCropHandler,
    deleteCropHandler,
    getCropsHandler,
} from "../controllers/crop.controller.js";
import {
    validateCreateCrop,
    validateUpdateCrop,
    validateCropIdParam,
    validateGetCropsQuery,
} from "../validators/crop.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetCropsQuery, getCropsHandler);
router.post("/", authenticated, validateCreateCrop, createCropHandler);
router.patch("/:id", authenticated, validateCropIdParam, validateUpdateCrop, updateCropHandler);
router.delete("/:id", authenticated, validateCropIdParam, deleteCropHandler);

export default router;