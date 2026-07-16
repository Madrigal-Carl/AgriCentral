import {
    createCrop,
    updateCrop,
    deleteCrop,
    getCrops,
    distributeCrop,
} from "../services/crop.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createCropHandler = asyncHandler(async (req, res) => {
    const crop = await createCrop(req.body, req.user?._id);

    return res.status(201).json({
        message: "Crop created successfully",
        crop,
    });
});

export const updateCropHandler = asyncHandler(async (req, res) => {
    const crop = await updateCrop(req.params.id, req.body);

    return res.status(200).json({
        message: "Crop updated successfully",
        crop,
    });
});

export const deleteCropHandler = asyncHandler(async (req, res) => {
    const crop = await deleteCrop(req.params.id);

    return res.status(200).json({
        message: "Crop deleted successfully",
        crop,
    });
});

export const getCropsHandler = asyncHandler(async (req, res) => {
    const { crops, pagination } = await getCrops(req.query);

    return res.status(200).json({
        message: "Crops fetched successfully",
        crops,
        pagination,
    });
});

export const distributeCropHandler = asyncHandler(async (req, res) => {
    const crop = await distributeCrop(req.params.id);

    return res.status(200).json({
        message: "Crop marked as distributed successfully",
        crop,
    });
});