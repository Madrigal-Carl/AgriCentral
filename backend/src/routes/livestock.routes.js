import express from "express";
import { getLivestockAvailabilityHandler } from "../controllers/availability.controller.js";
import {
    createLivestockHandler,
    updateLivestockHandler,
    deleteLivestockHandler,
    getLivestocksHandler,
    getAvailableLivestocksHandler,
    getLivestockHandler,
    getLivestockMothersHandler,
} from "../controllers/livestock.controller.js";
import {
    validateCreateLivestock,
    validateUpdateLivestock,
    validateLivestockIdParam,
    validateGetLivestocksQuery,
    validateGetLivestockMothersQuery,
} from "../validators/livestock.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/availability", authenticated, allowRoles("far"), getLivestockAvailabilityHandler);

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetLivestocksQuery, getLivestocksHandler);
router.get("/available", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), getAvailableLivestocksHandler);
router.get("/mothers", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetLivestockMothersQuery, getLivestockMothersHandler);
router.get("/:id", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), validateLivestockIdParam, getLivestockHandler);
router.post("/", authenticated, allowRoles("coordinator", "admin"), validateCreateLivestock, createLivestockHandler);
router.patch("/:id", authenticated, allowRoles("far", "coordinator", "admin"), validateLivestockIdParam, validateUpdateLivestock, updateLivestockHandler);
router.delete("/:id", authenticated, allowRoles("coordinator", "admin"), validateLivestockIdParam, deleteLivestockHandler);

export default router;
