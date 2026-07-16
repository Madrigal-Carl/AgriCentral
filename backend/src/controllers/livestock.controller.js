import {
    createLivestock,
    updateLivestock,
    deleteLivestock,
    getLivestocks,
    getAvailableLivestocks,
} from "../services/livestock.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await createLivestock(req.body, req.user?._id);

    return res.status(201).json({
        message: "Livestock created successfully",
        livestock,
    });
});

export const updateLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await updateLivestock(req.params.id, req.body);

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
    const { livestocks, pagination } = await getLivestocks(req.query);

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