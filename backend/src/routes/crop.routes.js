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
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetCropsQuery, getCropsHandler);
router.post("/", authenticated, allowRoles("coordinator", "admin"), validateCreateCrop, createCropHandler);
router.patch("/:id/distribute", authenticated, allowRoles("aew"), validateCropIdParam, distributeCropHandler);
router.patch("/:id", authenticated, allowRoles("coordinator", "admin"), validateCropIdParam, validateUpdateCrop, updateCropHandler);
router.delete("/:id", authenticated, allowRoles("coordinator", "admin"), validateCropIdParam, deleteCropHandler);

export default router;