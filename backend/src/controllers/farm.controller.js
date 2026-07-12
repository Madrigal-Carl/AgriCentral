import {
    createFarm,
    updateFarm,
    deleteFarm,
    getFarms,
    getFarmsByUserId,
} from "../services/farm.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createFarmHandler = asyncHandler(async (req, res) => {
    const farm = await createFarm(req.body, req.user?._id);

    return res.status(201).json({
        message: "Farm created successfully",
        farm,
    });
});

export const updateFarmHandler = asyncHandler(async (req, res) => {
    const farm = await updateFarm(req.params.id, req.body);

    return res.status(200).json({
        message: "Farm updated successfully",
        farm,
    });
});

export const deleteFarmHandler = asyncHandler(async (req, res) => {
    const farm = await deleteFarm(req.params.id);

    return res.status(200).json({
        message: "Farm deleted successfully",
        farm,
    });
});

export const getFarmsByUserIdHandler = asyncHandler(async (req, res) => {
    const farms = await getFarmsByUserId(req.params.userId);

    return res.status(200).json({
        message: "Farms fetched successfully",
        farms,
    });
});

export const getFarmsHandler = asyncHandler(async (req, res) => {
    const { farms, pagination } = await getFarms(req.query);

    return res.status(200).json({
        message: "Farms fetched successfully",
        farms,
        pagination,
    });
});