import express from "express";
import { getAnalyticsHandler } from "../controllers/analytics.controller.js";
import { validateGetAnalyticsQuery } from "../validators/analytics.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetAnalyticsQuery, getAnalyticsHandler);

export default router;