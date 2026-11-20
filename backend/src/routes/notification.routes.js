import express from "express";
import {
    getNotificationsHandler,
    getUnreadNotificationCountHandler,
    markNotificationReadHandler,
    markAllNotificationsReadHandler,
} from "../controllers/notification.controller.js";
import {
    validateGetNotificationsQuery,
    validateNotificationIdParam,
} from "../validators/notification.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetNotificationsQuery, getNotificationsHandler);
router.get("/unread-count", authenticated, getUnreadNotificationCountHandler);
// read-all is declared before /:id/read so it is never taken for an id.
router.patch("/read-all", authenticated, markAllNotificationsReadHandler);
router.patch("/:id/read", authenticated, validateNotificationIdParam, markNotificationReadHandler);

export default router;
