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
router.patch("/:id", authenticated, validateReportIdParam, validateUpdateReport, updateReportHandler);
router.patch(
    "/:id/approval",
    authenticated,
    validateReportIdParam,
    validateUpdateReportApproval,
    updateReportApprovalHandler,
);
router.delete("/:id", authenticated, validateReportIdParam, deleteReportHandler);

export default router;