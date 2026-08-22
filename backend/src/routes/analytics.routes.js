import express from "express";
import {
    getAnalyticsHandler,
    getOverviewHandler,
    exportAnalyticsPdfHandler,
    exportAnalyticsExcelHandler,
} from "../controllers/analytics.controller.js";
import {
    validateGetAnalyticsQuery,
    validateExportAnalyticsPdfQuery,
    validateExportAnalyticsExcelQuery,
} from "../validators/analytics.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("coordinator", "governor", "head"), validateGetAnalyticsQuery, getAnalyticsHandler);
router.get("/overview", authenticated, allowRoles("far", "aew", "coordinator", "governor", "head", "admin"), scopeByAssociationId, getOverviewHandler);
router.get("/export-pdf", authenticated, allowRoles("coordinator", "governor", "head"), validateExportAnalyticsPdfQuery, exportAnalyticsPdfHandler);
router.get("/export-excel", authenticated, allowRoles("coordinator", "governor", "head"), validateExportAnalyticsExcelQuery, exportAnalyticsExcelHandler);

export default router;