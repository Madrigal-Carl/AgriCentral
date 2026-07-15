import Crop from "../models/crop.model.js";
import Farm from "../models/farm.model.js";
import User from "../models/user.model.js";
import Farmer from "../models/farmer.model.js";
import { createLog } from "./log.service.js";

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

export const createCrop = async (data, authenticatedUserId) => {
    const { associationId, ...cropData } = data;

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const crop = await Crop.create({
        ...cropData,
        association: resolvedAssociationId || undefined,
    });

    // assignedFarmer is required at creation, so this always fires.
    const farmer = await Farmer.findById(crop.assignedFarmer).select("firstName lastName");
    if (farmer) {
        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: crop.association,
            message: `${farmer.getFullName()} received a new crop batch: ${crop.name} (${crop.kilo} kg).`,
        });
    }

    return crop;
};

export const updateCrop = async (id, data) => {
    const { associationId, ...cropData } = data;
    if (associationId !== undefined) {
        cropData.association = associationId;
    }

    const needsPrevious = cropData.assignedFarmer !== undefined;
    const previousCrop = needsPrevious
        ? await Crop.findOne({ _id: id, deletedAt: null }).select("assignedFarmer name")
        : null;

    const crop = await Crop.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: cropData },
        { new: true, runValidators: true }
    );

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    // Crop reassigned to a different farmer.
    if (
        cropData.assignedFarmer !== undefined &&
        String(previousCrop?.assignedFarmer ?? "") !== String(crop.assignedFarmer)
    ) {
        const farmer = await Farmer.findById(crop.assignedFarmer).select("firstName lastName");
        if (farmer) {
            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: crop.association,
                message: `${farmer.getFullName()} received a new crop batch: ${crop.name} (${crop.quantity} kg).`,
            });
        }
    }

    return crop;
};

export const deleteCrop = async (id) => {
    const crop = await Crop.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return crop;
};

export const restoreCrop = async (id) => {
    const crop = await Crop.findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { $set: { deletedAt: null } },
        { new: true }
    );

    if (!crop) {
        const notFoundError = new Error("Deleted crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return crop;
};

export const getCropsByFarmId = async (farmId) => {
    const farm = await Farm.findById(farmId).select("assignedFarmers crops.crop crops.status");

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const activeStatuses = ["planted", "growing"];

    const plantedOnThisFarmIds = farm.crops
        .filter((c) => activeStatuses.includes(c.status))
        .map((c) => c.crop);

    const crops = await Crop.find({
        assignedFarmer: { $in: farm.assignedFarmers },
        deletedAt: null,
        $or: [
            { status: "not_planted" },
            { _id: { $in: plantedOnThisFarmIds } },
        ],
    }).sort({ createdAt: -1 });

    return crops;
};

export const getCrops = async ({ status, search, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (status) filter.status = status;
    if (associationId) filter.association = associationId;

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const crops = await Crop.find(filter).sort({ createdAt: -1 });
        return {
            crops,
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [crops, total] = await Promise.all([
        Crop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Crop.countDocuments(filter),
    ]);

    return {
        crops,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}