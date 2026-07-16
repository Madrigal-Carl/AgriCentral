import express from "express";
import {
    createCropHandler,
    updateCropHandler,
    deleteCropHandler,
    getCropsHandler,
    distributeCropHandler,
} from "../controllers/crop.controller.js";
import {
    validateCreateCrop,
    validateUpdateCrop,
    validateCropIdParam,
    validateGetCropsQuery,
} from "../validators/crop.validator.js";
import { authenticated, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByAssociationId, validateGetCropsQuery, getCropsHandler);
router.post("/", authenticated, validateCreateCrop, createCropHandler);
router.patch("/:id/distribute", authenticated, validateCropIdParam, distributeCropHandler);
router.patch("/:id", authenticated, validateCropIdParam, validateUpdateCrop, updateCropHandler);
router.delete("/:id", authenticated, validateCropIdParam, deleteCropHandler);

export default router;