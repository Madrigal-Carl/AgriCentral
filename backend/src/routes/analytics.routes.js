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
import { authenticated, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetAnalyticsQuery, getAnalyticsHandler);
router.get("/overview", authenticated, scopeByAssociationId, getOverviewHandler);
router.get("/export-pdf", authenticated, validateExportAnalyticsPdfQuery, exportAnalyticsPdfHandler);

export default router;