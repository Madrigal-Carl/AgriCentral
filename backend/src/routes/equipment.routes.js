import express from "express";
import {
    createEquipmentHandler,
    updateEquipmentHandler,
    deleteEquipmentHandler,
    getEquipmentsHandler,
    getAvailableEquipmentsHandler,
} from "../controllers/equipment.controller.js";
import {
    validateCreateEquipment,
    validateUpdateEquipment,
    validateEquipmentIdParam,
    validateGetEquipmentsQuery,
} from "../validators/equipment.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "head", "governor", "admin"), scopeByAssociationId, validateGetEquipmentsQuery, getEquipmentsHandler);
router.get("/available", authenticated, allowRoles("far", "aew", "coordinator", "head", "governor", "admin"), getAvailableEquipmentsHandler);
router.post("/", authenticated, allowRoles("coordinator", "admin"), validateCreateEquipment, createEquipmentHandler);
router.patch("/:id", authenticated, allowRoles("far", "coordinator", "admin"), validateEquipmentIdParam, validateUpdateEquipment, updateEquipmentHandler);
router.delete("/:id", authenticated, allowRoles("coordinator", "admin"), validateEquipmentIdParam, deleteEquipmentHandler);

export default router;