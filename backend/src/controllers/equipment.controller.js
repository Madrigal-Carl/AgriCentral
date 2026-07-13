import {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipments,
} from "../services/equipment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEquipmentHandler = asyncHandler(async (req, res) => {
    const equipment = await createEquipment(req.body, req.user?._id);

    return res.status(201).json({
        message: "Equipment created successfully",
        equipment,
    });
});

export const updateEquipmentHandler = asyncHandler(async (req, res) => {
    const equipment = await updateEquipment(req.params.id, req.body);

    return res.status(200).json({
        message: "Equipment updated successfully",
        equipment,
    });
});

export const deleteEquipmentHandler = asyncHandler(async (req, res) => {
    const equipment = await deleteEquipment(req.params.id);

    return res.status(200).json({
        message: "Equipment deleted successfully",
        equipment,
    });
});

export const getEquipmentsHandler = asyncHandler(async (req, res) => {
    const { equipments, pagination } = await getEquipments(req.query);

    return res.status(200).json({
        message: "Equipment fetched successfully",
        equipments,
        pagination,
    });
});