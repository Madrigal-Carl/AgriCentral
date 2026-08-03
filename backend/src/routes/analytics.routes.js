import express from "express";
import {
    getAnalyticsHandler,
    exportAnalyticsPdfHandler,
} from "../controllers/analytics.controller.js";
import {
    validateGetAnalyticsQuery,
    validateExportAnalyticsPdfQuery,
} from "../validators/analytics.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetAnalyticsQuery, getAnalyticsHandler);
router.get("/export-pdf", authenticated, validateExportAnalyticsPdfQuery, exportAnalyticsPdfHandler);

export default router;