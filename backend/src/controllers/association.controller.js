import {
    createAssociation,
    updateAssociation,
    deleteAssociation,
    getAssociations,
} from "../services/association.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createAssociationHandler = asyncHandler(async (req, res) => {
    const association = await createAssociation(req.body);

    return res.status(201).json({
        message: "Association created successfully",
        association,
    });
});

export const updateAssociationHandler = asyncHandler(async (req, res) => {
    const association = await updateAssociation(req.params.id, req.body);

    return res.status(200).json({
        message: "Association updated successfully",
        association,
    });
});

export const deleteAssociationHandler = asyncHandler(async (req, res) => {
    const association = await deleteAssociation(req.params.id);

    return res.status(200).json({
        message: "Association deleted successfully",
        association,
    });
});

export const getAssociationsHandler = asyncHandler(async (req, res) => {
    const { associations, pagination } = await getAssociations(req.query);

    return res.status(200).json({
        message: "Associations fetched successfully",
        associations,
        pagination,
    });
});