import express from "express";
import {
    createLivestockHandler,
    updateLivestockHandler,
    deleteLivestockHandler,
    getLivestocksHandler,
    getAvailableLivestocksHandler,
} from "../controllers/livestock.controller.js";
import {
    validateCreateLivestock,
    validateUpdateLivestock,
    validateLivestockIdParam,
    validateGetLivestocksQuery,
} from "../validators/livestock.validator.js";
import { authenticated, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByAssociationId, validateGetLivestocksQuery, getLivestocksHandler);
router.get("/available", authenticated, getAvailableLivestocksHandler);
router.post("/", authenticated, validateCreateLivestock, createLivestockHandler);
router.patch("/:id", authenticated, validateLivestockIdParam, validateUpdateLivestock, updateLivestockHandler);
router.delete("/:id", authenticated, validateLivestockIdParam, deleteLivestockHandler);

export default router;