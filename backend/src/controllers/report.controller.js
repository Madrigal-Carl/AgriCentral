import {
    createReport,
    updateReport,
    updateReportApproval,
    deleteReport,
    getReports,
} from "../services/report.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReportHandler = asyncHandler(async (req, res) => {
    const report = await createReport(req.body, req.user);

    return res.status(201).json({
        message: "Report created successfully",
        report,
    });
});

export const updateReportHandler = asyncHandler(async (req, res) => {
    const report = await updateReport(req.params.id, req.body);

    return res.status(200).json({
        message: "Report updated successfully",
        report,
    });
});

export const updateReportApprovalHandler = asyncHandler(async (req, res) => {
    const report = await updateReportApproval(req.params.id, req.body, req.user);

    return res.status(200).json({
        message: "Report review submitted successfully",
        report,
    });
});

export const deleteReportHandler = asyncHandler(async (req, res) => {
    const report = await deleteReport(req.params.id);

    return res.status(200).json({
        message: "Report deleted successfully",
        report,
    });
});

export const getReportsHandler = asyncHandler(async (req, res) => {
    const { reports, pagination } = await getReports(req.query);

    return res.status(200).json({
        message: "Reports fetched successfully",
        reports,
        pagination,
    });
});