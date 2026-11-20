import express from "express";
import {
    createCropHandler,
    createFarmerOwnedCropHandler,
    updateCropHandler,
    deleteCropHandler,
    getCropsHandler,
    distributeCropHandler,
} from "../controllers/crop.controller.js";
import {
    validateCreateCrop,
    validateCreateFarmerOwnedCrop,
    validateUpdateCrop,
    validateCropIdParam,
    validateGetCropsQuery,
} from "../validators/crop.validator.js";
import { authenticated, allowRoles, farOnly, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetCropsQuery, getCropsHandler);
router.post("/", authenticated, allowRoles("coordinator", "admin"), validateCreateCrop, createCropHandler);
router.post("/farmer-owned", authenticated, farOnly, validateCreateFarmerOwnedCrop, createFarmerOwnedCropHandler);
router.patch("/:id/distribute", authenticated, allowRoles("aew"), validateCropIdParam, distributeCropHandler);
router.patch("/:id", authenticated, allowRoles("coordinator", "admin"), validateCropIdParam, validateUpdateCrop, updateCropHandler);
router.delete("/:id", authenticated, allowRoles("coordinator", "admin"), validateCropIdParam, deleteCropHandler);

export default router;