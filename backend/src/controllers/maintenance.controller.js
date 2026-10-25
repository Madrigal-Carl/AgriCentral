import { asyncHandler } from "../utils/asyncHandler.js";
import { getMaintenance, getMaintenanceUsage, saveMaintenance, archiveMaintenance, getLookups } from "../services/maintenance.service.js";

export const maintenanceListHandler = (type) => asyncHandler(async (req, res) => res.json(await getMaintenance(type, req.query)));
export const maintenanceUsageHandler = (type) => asyncHandler(async (req, res) => res.json(await getMaintenanceUsage(type, req.params.id)));
export const maintenanceSaveHandler = (type) => asyncHandler(async (req, res) => res.status(req.params.id ? 200 : 201).json({ message: "Item saved successfully", item: await saveMaintenance(type, req.body, req.params.id) }));
export const maintenanceArchiveHandler = (type, restore = false) => asyncHandler(async (req, res) => res.json({ message: `Item ${restore ? "restored" : "archived"} successfully`, item: await archiveMaintenance(type, req.params.id, restore) }));
export const lookupHandler = asyncHandler(async (req, res) => res.json({ lookups: await getLookups(req.query.types) }));
