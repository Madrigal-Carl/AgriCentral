import Crop from "../models/crop.model.js";
import Farm from "../models/farm.model.js";
import User from "../models/user.model.js";
import Farmer from "../models/farmer.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };
const FARMER_POPULATE = { path: "assignedFarmer", select: "firstName lastName" };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

const getAssociationName = async (associationId) => {
    if (!associationId) return null;
    const association = await Association.findById(associationId).select("name");
    return association?.name ?? null;
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
        const associationName = await getAssociationName(crop.association);

        await createLog({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association,
            message: `${crop.name} (${crop.kilo} kg) has been assigned to ${farmer.getFullName()}${associationName ? ` in ${associationName}` : ""
                }.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: crop.association,
            message: `${farmer.getFullName()} received a new crop batch: ${crop.name} (${crop.kilo} kg).`,
        });
    }

    await crop.populate([FARMER_POPULATE, ASSOCIATION_POPULATE]);

    return crop;
};

export const updateCrop = async (id, data) => {
    const { associationId, ...cropData } = data;
    if (associationId !== undefined) {
        cropData.association = associationId;
    }

    const needsPrevious =
        cropData.assignedFarmer !== undefined || cropData.association !== undefined;
    const previousCrop = needsPrevious
        ? await Crop.findOne({ _id: id, deletedAt: null }).select("assignedFarmer association name")
        : null;

    const crop = await Crop.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: cropData },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, ASSOCIATION_POPULATE]);

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    // Crop reassigned to a different farmer and/or association.
    const farmerChanged =
        cropData.assignedFarmer !== undefined &&
        String(previousCrop?.assignedFarmer ?? "") !== String(crop.assignedFarmer?._id ?? "");
    const associationChanged =
        cropData.association !== undefined &&
        String(previousCrop?.association ?? "") !== String(crop.association?._id ?? crop.association ?? "");

    if (farmerChanged && crop.assignedFarmer) {
        const associationName = await getAssociationName(crop.association?._id ?? crop.association);
        const farmerName = crop.assignedFarmer.getFullName?.() ?? "a farmer";

        await createLog({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association?._id ?? crop.association,
            message: `${crop.name} has been reassigned to ${farmerName}${associationName ? ` in ${associationName}` : ""
                }.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: crop.assignedFarmer._id,
            association: crop.association?._id ?? crop.association,
            message: `${farmerName} received a reassigned crop batch: ${crop.name} (${crop.kilo} kg).`,
        });
    } else if (associationChanged) {
        // Association changed on its own (farmer unchanged) — still worth a crop-level note.
        const associationName = await getAssociationName(crop.association?._id ?? crop.association);

        await createLog({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association?._id ?? crop.association,
            message: associationName
                ? `${crop.name} has been reassigned to ${associationName}.`
                : `${crop.name} has been removed from its association.`,
        });
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

export const distributeCrop = async (id) => {
    const crop = await Crop.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { isDistributed: true } },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, ASSOCIATION_POPULATE]);

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (crop.assignedFarmer) {
        const farmerName = crop.assignedFarmer.getFullName?.() ?? "the farmer";

        await createLog({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association?._id ?? crop.association,
            message: `${crop.name} (${crop.kilo} kg) has been distributed to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: crop.assignedFarmer._id,
            association: crop.association?._id ?? crop.association,
            message: `${farmerName} has received the distributed crop batch: ${crop.name} (${crop.kilo} kg).`,
        });
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

    const assignedFarmerIds = farm.assignedFarmers.map((a) => a.farmer);

    const crops = await Crop.find({
        assignedFarmer: { $in: assignedFarmerIds },
        deletedAt: null,
        isDistributed: true,
        $or: [
            { status: "not_planted" },
            { _id: { $in: plantedOnThisFarmIds } },
        ],
    })
        .populate("association")
        .populate("assignedFarmer", "firstName lastName")
        .sort({ createdAt: -1 });

    return crops;
};

const attachHistory = async (crops, associationId) => {
    const cropIds = crops.map((c) => c._id);

    if (!cropIds.length) return [];

    const logsByCropId = await getLogsForEntities("crop", cropIds, associationId);

    return crops.map((c) => {
        const obj = typeof c.toObject === "function" ? c.toObject() : c;
        const key = obj._id.toString();
        return {
            ...obj,
            history: logsByCropId.get(key) ?? [],
        };
    });
};

export const getCrops = async ({ status, search, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (status) filter.status = status;
    if (associationId) {
        filter.association = associationId;
        filter.isDistributed = true;
    }

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const crops = await Crop.find(filter).populate("association", "name").populate("assignedFarmer", "firstName lastName").sort({ createdAt: -1 });
        return {
            crops: await attachHistory(crops, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [crops, total] = await Promise.all([
        Crop.find(filter).populate("association", "name").populate("assignedFarmer", "firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(limit),
        Crop.countDocuments(filter),
    ]);

    return {
        crops: await attachHistory(crops, associationId),
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