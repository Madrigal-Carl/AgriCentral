import express from "express";
import { authenticated, allowRoles } from "../middlewares/auth.middleware.js";
import { validateMaintenanceBody, validateMaintenanceQuery, validateMaintenanceId, validateLookupQuery } from "../validators/maintenance.validator.js";
import { maintenanceListHandler, maintenanceUsageHandler, maintenanceSaveHandler, maintenanceArchiveHandler, lookupHandler } from "../controllers/maintenance.controller.js";

export function maintenanceRoutes(type) {
    const router = express.Router();
    router.use(authenticated, allowRoles("admin"));
    router.get("/", validateMaintenanceQuery, maintenanceListHandler(type));
    router.get("/:id/usage", validateMaintenanceId, maintenanceUsageHandler(type));
    router.post("/", validateMaintenanceBody(type), maintenanceSaveHandler(type));
    router.patch("/:id", validateMaintenanceId, validateMaintenanceBody(type, true), maintenanceSaveHandler(type));
    router.delete("/:id", validateMaintenanceId, maintenanceArchiveHandler(type));
    router.patch("/:id/restore", validateMaintenanceId, maintenanceArchiveHandler(type, true));
    return router;
}

export const lookupRoutes = express.Router();
lookupRoutes.get("/", authenticated, allowRoles("far", "aew", "coordinator", "governor", "head", "admin"), validateLookupQuery, lookupHandler);
