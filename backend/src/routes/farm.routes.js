import express from "express";
import {
    createFarmHandler,
    updateFarmHandler,
    deleteFarmHandler,
    getFarmsHandler,
} from "../controllers/farm.controller.js";
import {
    validateCreateFarm,
    validateUpdateFarm,
    validateFarmIdParam,
    validateGetFarmsQuery,
} from "../validators/farm.validator.js";
import { authenticated, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByAssociationId, validateGetFarmsQuery, getFarmsHandler);
router.post("/", authenticated, validateCreateFarm, createFarmHandler);
router.patch("/:id", authenticated, validateFarmIdParam, validateUpdateFarm, updateFarmHandler);
router.delete("/:id", authenticated, validateFarmIdParam, deleteFarmHandler);

export default router;