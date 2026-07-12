import express from "express";
import {
    createFarmHandler,
    updateFarmHandler,
    deleteFarmHandler,
    getFarmsHandler,
    getFarmsByUserIdHandler,
} from "../controllers/farm.controller.js";
import {
    validateCreateFarm,
    validateUpdateFarm,
    validateFarmIdParam,
    validateFarmUserIdParam,
    validateGetFarmsQuery,
} from "../validators/farm.validator.js";
import { authenticated, scopeByUserId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByUserId, validateGetFarmsQuery, getFarmsHandler);
router.get("/:userId", authenticated, validateFarmUserIdParam, getFarmsByUserIdHandler);
router.post("/", authenticated, validateCreateFarm, createFarmHandler);
router.patch("/:id", authenticated, validateFarmIdParam, validateUpdateFarm, updateFarmHandler);
router.delete("/:id", authenticated, validateFarmIdParam, deleteFarmHandler);

export default router;