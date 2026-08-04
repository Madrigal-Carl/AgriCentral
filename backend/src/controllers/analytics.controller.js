import { getAnalytics, getOverview } from "../services/analytics.service.js";
import { generateAnalyticsPdf } from "../services/pdf.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAnalyticsHandler = asyncHandler(async (req, res) => {
    const data = await getAnalytics(req.query);

    return res.status(200).json({
        message: "Analytics fetched successfully",
        data,
    });
});

export const getOverviewHandler = asyncHandler(async (req, res) => {
    const { associationId } = req.query;

    const data = await getOverview({ associationId });

    return res.status(200).json({
        message: "Overview fetched successfully",
        data,
    });
});

export const exportAnalyticsPdfHandler = asyncHandler(async (req, res) => {
    const { section, association, period } = req.query;

    const pdfBuffer = await generateAnalyticsPdf({ section, association, period });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="agricentral-${section}-report.pdf"`,
    );
    return res.status(200).send(pdfBuffer);
});