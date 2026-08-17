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
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetLivestocksQuery, getLivestocksHandler);
router.get("/available", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), getAvailableLivestocksHandler);
router.post("/", authenticated, allowRoles("coordinator", "admin"), validateCreateLivestock, createLivestockHandler);
router.patch("/:id", authenticated, allowRoles("far", "coordinator", "admin"), validateLivestockIdParam, validateUpdateLivestock, updateLivestockHandler);
router.delete("/:id", authenticated, allowRoles("coordinator", "admin"), validateLivestockIdParam, deleteLivestockHandler);

export default router;