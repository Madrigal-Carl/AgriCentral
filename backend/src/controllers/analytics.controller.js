import { getAnalytics } from "../services/analytics.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAnalyticsHandler = asyncHandler(async (req, res) => {
    const data = await getAnalytics(req.query);

    return res.status(200).json({
        message: "Analytics fetched successfully",
        data,
    });
});