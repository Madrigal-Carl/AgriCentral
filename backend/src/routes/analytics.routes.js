import express from "express";
import {
    getAnalyticsHandler,
    getOverviewHandler,
    exportAnalyticsPdfHandler,
} from "../controllers/analytics.controller.js";
import {
    validateGetAnalyticsQuery,
    validateExportAnalyticsPdfQuery,
} from "../validators/analytics.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("coordinator", "governor", "head"), validateGetAnalyticsQuery, getAnalyticsHandler);
router.get("/overview", authenticated, allowRoles("far", "aew", "coordinator", "governor", "head", "admin"), scopeByAssociationId, getOverviewHandler);
router.get("/export-pdf", authenticated, allowRoles("coordinator", "governor", "head"), validateExportAnalyticsPdfQuery, exportAnalyticsPdfHandler);

export default router;