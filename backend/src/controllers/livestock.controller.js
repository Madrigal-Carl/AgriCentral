import {
    createLivestock,
    updateLivestock,
    deleteLivestock,
    getLivestocks,
    getAvailableLivestocks,
    getLivestock,
} from "../services/livestock.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEligibleLivestockMothers } from "../services/livestockLineage.service.js";

export const createLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await createLivestock(req.body, req.user?._id, req.user);

    return res.status(201).json({
        message: "Livestock created successfully",
        livestock,
    });
});

export const updateLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await updateLivestock(req.params.id, req.body, req.user);

    return res.status(200).json({
        message: "Livestock updated successfully",
        livestock,
    });
});

export const deleteLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await deleteLivestock(req.params.id);

    return res.status(200).json({
        message: "Livestock deleted successfully",
        livestock,
    });
});

export const getLivestocksHandler = asyncHandler(async (req, res) => {
    const { livestocks, pagination } = await getLivestocks(req.query, req.user);

    return res.status(200).json({
        message: "Livestock fetched successfully",
        livestocks,
        pagination,
    });
});

export const getAvailableLivestocksHandler = asyncHandler(async (req, res) => {
    const livestocks = await getAvailableLivestocks();

    return res.status(200).json({
        message: "Available livestock fetched successfully",
        livestocks,
    });
});

export const getLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await getLivestock(req.params.id, req.user);
    res.status(200).json({ message: "Livestock fetched successfully", livestock });
});

export const getLivestockMothersHandler = asyncHandler(async (req, res) => {
    const livestocks = await getEligibleLivestockMothers(req.query, req.user);
    res.status(200).json({ message: "Eligible mothers fetched successfully", livestocks });
});
