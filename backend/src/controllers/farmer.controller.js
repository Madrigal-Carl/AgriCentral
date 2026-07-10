import { createFarmer } from "../services/farmer.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createFarmerHandler = asyncHandler(async (req, res) => {
    const farmer = await createFarmer(req.body, req.user?._id);

    return res.status(201).json({
        message: "Farmer created successfully",
        farmer,
    });
});