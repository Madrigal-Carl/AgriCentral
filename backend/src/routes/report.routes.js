import express from "express";
import {
    createReportHandler,
    updateReportHandler,
    updateReportApprovalHandler,
    deleteReportHandler,
    getReportsHandler,
} from "../controllers/report.controller.js";
import {
    validateCreateReport,
    validateUpdateReport,
    validateUpdateReportApproval,
    validateReportIdParam,
    validateGetReportsQuery,
} from "../validators/report.validator.js";
import {
    authenticated,
    allowRoles,
    scopeReportsByRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authenticated,
    allowRoles("far", "aew", "coordinator", "governor", "head", "admin"),
    scopeReportsByRole,
    validateGetReportsQuery,
    getReportsHandler,
);
router.post(
    "/",
    authenticated,
    allowRoles("far", "aew"),
    validateCreateReport,
    createReportHandler,
);
router.patch("/:id", authenticated, allowRoles("far", "aew"), validateReportIdParam, validateUpdateReport, updateReportHandler);
router.patch(
    "/:id/approval",
    authenticated,
    allowRoles("aew", "coordinator"),
    validateReportIdParam,
    validateUpdateReportApproval,
    updateReportApprovalHandler,
);
router.delete("/:id", authenticated, allowRoles("far", "aew"), validateReportIdParam, deleteReportHandler);

export default router;