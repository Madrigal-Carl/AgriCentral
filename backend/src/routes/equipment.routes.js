import express from "express";
import {
    createEquipmentHandler,
    updateEquipmentHandler,
    deleteEquipmentHandler,
    getEquipmentsHandler,
} from "../controllers/equipment.controller.js";
import {
    validateCreateEquipment,
    validateUpdateEquipment,
    validateEquipmentIdParam,
    validateGetEquipmentsQuery,
} from "../validators/equipment.validator.js";
import { authenticated, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, scopeByAssociationId, validateGetEquipmentsQuery, getEquipmentsHandler);
router.post("/", authenticated, validateCreateEquipment, createEquipmentHandler);
router.patch("/:id", authenticated, validateEquipmentIdParam, validateUpdateEquipment, updateEquipmentHandler);
router.delete("/:id", authenticated, validateEquipmentIdParam, deleteEquipmentHandler);

export default router;