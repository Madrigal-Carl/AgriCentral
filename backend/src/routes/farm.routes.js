import express from "express";
import {
    createFarmHandler,
    updateFarmHandler,
    deleteFarmHandler,
    getFarmsHandler,
    getFarmMapHandler,
} from "../controllers/farm.controller.js";
import {
    validateCreateFarm,
    validateUpdateFarm,
    validateFarmIdParam,
    validateGetFarmsQuery,
} from "../validators/farm.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/map", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetFarmsQuery, getFarmMapHandler);
router.get("/", authenticated, allowRoles("far", "aew", "head", "admin"), scopeByAssociationId, validateGetFarmsQuery, getFarmsHandler);
router.post("/", authenticated, allowRoles("far", "aew", "admin"), validateCreateFarm, createFarmHandler);
router.patch("/:id", authenticated, allowRoles("far", "aew", "admin"), validateFarmIdParam, validateUpdateFarm, updateFarmHandler);
router.delete("/:id", authenticated, allowRoles("far", "aew", "admin"), validateFarmIdParam, deleteFarmHandler);

export default router;
