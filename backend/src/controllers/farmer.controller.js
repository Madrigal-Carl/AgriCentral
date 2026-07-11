import {
    createFarmer,
    updateFarmer,
    deleteFarmer,
    getFarmers,
    getFarmersByUserId,
} from "../services/farmer.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createFarmerHandler = asyncHandler(async (req, res) => {
    const farmer = await createFarmer(req.body, req.user?._id);

    return res.status(201).json({
        message: "Farmer created successfully",
        farmer,
    });
});

export const updateFarmerHandler = asyncHandler(async (req, res) => {
    const farmer = await updateFarmer(req.params.id, req.body);

    return res.status(200).json({
        message: "Farmer updated successfully",
        farmer,
    });
});

export const deleteFarmerHandler = asyncHandler(async (req, res) => {
    const farmer = await deleteFarmer(req.params.id);

    return res.status(200).json({
        message: "Farmer deleted successfully",
        farmer,
    });
});

export const getFarmersByUserIdHandler = asyncHandler(async (req, res) => {
    const farmers = await getFarmersByUserId(req.params.userId);

    return res.status(200).json({
        message: "Farmers fetched successfully",
        farmers,
    });
});

export const getFarmersHandler = asyncHandler(async (req, res) => {
    const { farmers, pagination } = await getFarmers(req.query);

    return res.status(200).json({
        message: "Farmers fetched successfully",
        farmers,
        pagination,
    });
});