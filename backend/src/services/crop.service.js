import Crop from "../models/crop.model.js";
import User from "../models/user.model.js";
import Farmer from "../models/farmer.model.js";
import Association from "../models/association.model.js";
import { validateInventoryLinks, CROP_TYPE_POPULATE } from "../utils/maintenanceLinks.js";
import { createLog, getLogsForEntities } from "./log.service.js";
import { plantedTotals } from "../utils/cropStock.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };
const FARMER_POPULATE = { path: "assignedFarmer", select: "firstName lastName" };

// Inventory endpoints (list, edit, archive, distribute) only ever touch
// government stock; farmer-owned crops are managed from the farm instead.
const GOVERNMENT_CROPS = { ownership: { $ne: "farmer" } };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

const getAssociationName = async (associationId) => {
    if (!associationId) return null;
    const association = await Association.findById(associationId).select("name");
    return association?.name ?? null;
};

export const createCrop = async (data, authenticatedUserId) => {
    const { associationId, ...cropData } = data;
    await validateInventoryLinks("crop", cropData);

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const crop = await Crop.create({
        ...cropData,
        association: resolvedAssociationId || undefined,
        unplanted: cropData.quantity ?? 0,
    });

    // assignedFarmer is required at creation, so this always fires.
    const farmer = await Farmer.findById(crop.assignedFarmer).select("firstName lastName");
    if (farmer) {
        const associationName = await getAssociationName(crop.association);

        await createLog({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association,
            message: `${crop.quantity} ${crop.name} has been assigned to ${farmer.getFullName()}${associationName ? ` in ${associationName}` : ""
                }.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: crop.association,
            message: `${farmer.getFullName()} received a new crop batch: ${crop.quantity} ${crop.name}.`,
        });
    }

    await crop.populate([FARMER_POPULATE, ASSOCIATION_POPULATE, CROP_TYPE_POPULATE]);

    return crop;
};

// FAR only: registers a crop the farmer owns (no stock, no association).
// The farm modal then attaches it to the farm being edited.
export const createFarmerOwnedCrop = async (data, authenticatedUserId) => {
    const associationId = await resolveAssociationId(undefined, authenticatedUserId);
    if (!associationId) {
        const forbiddenError = new Error("Your account is not linked to an association");
        forbiddenError.statusCode = 403;
        throw forbiddenError;
    }

    const farmer = await Farmer.findOne({ _id: data.assignedFarmer, deletedAt: null }).select("firstName lastName association");
    if (!farmer || String(farmer.association) !== String(associationId)) {
        const notFoundError = new Error("Farmer not found in your association");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const cropData = { cropType: data.cropType };
    await validateInventoryLinks("crop", cropData);

    const crop = await Crop.create({
        ...cropData,
        ownership: "farmer",
        // The optional name overrides the crop type's name set above.
        name: data.name || cropData.name,
        assignedFarmer: farmer._id,
        quantity: 0,
        unplanted: 0,
    });

    await createLog({
        entityType: "crop",
        entityId: crop._id,
        association: associationId,
        message: `${crop.name} was registered as a farmer-owned crop of ${farmer.getFullName()}.`,
    });
    await createLog({
        entityType: "farmer",
        entityId: farmer._id,
        association: associationId,
        message: `${farmer.getFullName()} registered their own crop: ${crop.name}.`,
    });

    await crop.populate([FARMER_POPULATE, CROP_TYPE_POPULATE]);
    return crop;
};

export const updateCrop = async (id, data) => {
    const { associationId, ...cropData } = data;
    if (cropData.cropType !== undefined) await validateInventoryLinks("crop", cropData, await Crop.findOne({ _id: id, ...GOVERNMENT_CROPS }) ?? {});
    if (associationId !== undefined) {
        cropData.association = associationId;
    }

    const needsPrevious =
        cropData.assignedFarmer !== undefined ||
        cropData.association !== undefined ||
        cropData.quantity !== undefined;
    const previousCrop = needsPrevious
        ? await Crop.findOne({ _id: id, deletedAt: null, ...GOVERNMENT_CROPS }).select(
            "assignedFarmer association name quantity unplanted"
        )
        : null;

    if (needsPrevious && !previousCrop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (cropData.quantity !== undefined) {
        // Planted so far comes from the farm records, not the stored copy.
        const plantedSoFar = (await plantedTotals([previousCrop._id])).get(String(previousCrop._id)) ?? 0;
        const newUnplanted = cropData.quantity - plantedSoFar;

        if (newUnplanted < 0) {
            const validationError = new Error(
                `Quantity cannot be reduced below the amount already planted (${plantedSoFar})`
            );
            validationError.statusCode = 400;
            throw validationError;
        }

        cropData.unplanted = newUnplanted;
    }

    const crop = await Crop.findOneAndUpdate(
        { _id: id, deletedAt: null, ...GOVERNMENT_CROPS },
        { $set: cropData },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, ASSOCIATION_POPULATE, CROP_TYPE_POPULATE]);

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
            message: `${farmerName} received a reassigned crop batch: ${crop.quantity} ${crop.name}.`,
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
        { _id: id, deletedAt: null, ...GOVERNMENT_CROPS },
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
        { _id: id, deletedAt: { $ne: null }, ...GOVERNMENT_CROPS },
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
        { _id: id, deletedAt: null, ...GOVERNMENT_CROPS },
        { $set: { isDistributed: true } },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, ASSOCIATION_POPULATE, CROP_TYPE_POPULATE]);

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
            message: `${crop.quantity} ${crop.name} has been distributed to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: crop.assignedFarmer._id,
            association: crop.association?._id ?? crop.association,
            message: `${farmerName} has received the distributed crop batch: ${crop.quantity} ${crop.name}.`,
        });
    }

    return crop;
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
            name: obj.cropType?.name ?? obj.name,
            history: logsByCropId.get(key) ?? [],
        };
    });
};

export const getCrops = async ({ id, search, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? { ...GOVERNMENT_CROPS } : { deletedAt: null, ...GOVERNMENT_CROPS };
    if (id) filter._id = id;
    if (associationId) {
        filter.association = associationId;
        filter.isDistributed = true;
    }

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const crops = await Crop.find(filter).populate(CROP_TYPE_POPULATE).populate("association", "name").populate("assignedFarmer", "firstName lastName").sort({ createdAt: -1 });
        return {
            crops: await attachHistory(crops, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [crops, total] = await Promise.all([
        Crop.find(filter).populate(CROP_TYPE_POPULATE).populate("association", "name").populate("assignedFarmer", "firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(limit),
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
