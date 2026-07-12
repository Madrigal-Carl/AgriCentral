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
    const farmer = await Farmer.findById(crop.assignedFarmer).select("fullName");
    if (farmer) {
        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: crop.association,
            message: `${farmer.fullName} received a new crop batch: ${crop.name}.`,
        });
    }

    return crop;
};

export const updateCrop = async (id, data) => {
    const needsPrevious = data.assignedFarmer !== undefined;
    const previousCrop = needsPrevious
        ? await Crop.findById(id).select("assignedFarmer name")
        : null;

    const crop = await Crop.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    // Crop reassigned to a different farmer.
    if (
        data.assignedFarmer !== undefined &&
        String(previousCrop?.assignedFarmer ?? "") !== String(crop.assignedFarmer)
    ) {
        const farmer = await Farmer.findById(crop.assignedFarmer).select("fullName");
        if (farmer) {
            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: crop.association,
                message: `${farmer.fullName} received a new crop batch: ${crop.name}.`,
            });
        }
    }

    return crop;
};


export const deleteCrop = async (id) => {
    const crop = await Crop.findByIdAndDelete(id);

    if (!crop) {
        const notFoundError = new Error("Crop not found");
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
        $or: [
            { status: "not_planted" },
            { _id: { $in: plantedOnThisFarmIds } },
        ],
    }).sort({ createdAt: -1 });

    return crops;
};

export const getCrops = async ({ status, search, associationId, all, page, limit }) => {
    const filter = {};
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