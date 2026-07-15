import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";

const CROP_POPULATE = { path: "crops.crop" };
const FARMER_POPULATE = { path: "assignedFarmers.farmer", select: "firstName lastName emailAddress" };
const ASSOCIATION_POPULATE = { path: "association", select: "name" };

const ACTIVE_CROP_STATUSES = ["planted", "growing"];

function filterActiveCrops(farm) {
    if (!farm) return farm;
    const farmObj = typeof farm.toObject === "function" ? farm.toObject() : farm;
    farmObj.crops = (farmObj.crops ?? []).filter((c) =>
        ACTIVE_CROP_STATUSES.includes(c.status)
    );
    return farmObj;
}

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

const logCropStatusChanges = async ({ farm, changes, cropIdToName }) => {
    for (const { cropId, fromStatus, toStatus } of changes) {
        const cropName = cropIdToName.get(cropId) ?? "A crop";
        const message = fromStatus
            ? `${cropName} on ${farm.tag} changed status from ${humanize(fromStatus)} to ${humanize(toStatus)}.`
            : `${cropName} was ${humanize(toStatus).toLowerCase()} on ${farm.tag}.`;

        await createLog({
            entityType: "farm",
            entityId: farm._id,
            association: farm.association,
            message,
        });
    }
};

const attachFarmHistory = async (farms, associationId) => {
    const farmIds = farms.map((f) => f._id);
    if (!farmIds.length) return [];

    const logsByFarmId = await getLogsForEntities("farm", farmIds, associationId);

    return farms.map((f) => {
        const obj = typeof f.toObject === "function" ? f.toObject() : f;
        const key = obj._id.toString();
        return {
            ...obj,
            history: logsByFarmId.get(key) ?? [],
        };
    });
};

// changes: array of
//   { farmerId, type: "added", toClassification }
//   { farmerId, type: "removed" }
//   { farmerId, type: "classification", fromClassification, toClassification }
const logFarmerAssignmentChanges = async ({ farm, changes }) => {
    if (!changes.length) return;

    const farmerIds = changes.map((c) => c.farmerId);
    const farmers = await Farmer.find({ _id: { $in: farmerIds } }).select("firstName lastName");
    const farmerIdToName = new Map(farmers.map((f) => [f._id.toString(), f.getFullName()]));

    for (const change of changes) {
        const farmerName = farmerIdToName.get(change.farmerId) ?? "A farmer";

        if (change.type === "added") {
            const classificationLabel = humanize(change.toClassification).toLowerCase();

            await createLog({
                entityType: "farmer",
                entityId: change.farmerId,
                association: farm.association,
                message: `${farmerName} was assigned to farm ${farm.tag} as ${classificationLabel}.`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                message: `${farmerName} was assigned to this farm as ${classificationLabel}.`,
            });
        } else if (change.type === "removed") {
            await createLog({
                entityType: "farmer",
                entityId: change.farmerId,
                association: farm.association,
                message: `${farmerName} was removed from farm ${farm.tag}.`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                message: `${farmerName} was removed from this farm.`,
            });
        } else if (change.type === "classification") {
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                message: `${farmerName}'s classification on ${farm.tag} changed from ${humanize(change.fromClassification)} to ${humanize(change.toClassification)}.`,
            });
        }
    }
};

export const createFarm = async (data, authenticatedUserId) => {
    const { associationId, ...farmData } = data;

    const existing = await Farm.findOne({ tag: farmData.tag, deletedAt: null });

    if (existing) {
        const error = new Error("A farm with this tag already exists");
        error.statusCode = 409;
        throw error;
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const farm = await Farm.create({
        ...farmData,
        association: resolvedAssociationId || undefined,
    });

    if (farmData.crops?.length) {
        const cropIds = farmData.crops.map((c) => c.crop);
        await Crop.updateMany(
            { _id: { $in: cropIds } },
            { $set: { status: "planted" } }
        );

        const crops = await Crop.find({ _id: { $in: cropIds } }).select("name");
        const cropIdToName = new Map(crops.map((c) => [c._id.toString(), c.name]));

        await logCropStatusChanges({
            farm,
            changes: farmData.crops.map((c) => ({
                cropId: c.crop.toString(),
                fromStatus: null,
                toStatus: c.status ?? "planted",
            })),
            cropIdToName,
        });
    }

    if (farmData.assignedFarmers?.length) {
        await logFarmerAssignmentChanges({
            farm,
            changes: farmData.assignedFarmers.map((a) => ({
                farmerId: a.farmer.toString(),
                type: "added",
                toClassification: a.classification ?? "owner",
            })),
        });
    }

    const populated = await farm.populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE]);
    return filterActiveCrops(populated);
};

export const updateFarm = async (id, data) => {
    const { associationId, ...farmData } = data;
    if (associationId !== undefined) {
        farmData.association = associationId;
    }

    if (farmData.tag) {
        const existing = await Farm.findOne({ tag: farmData.tag, _id: { $ne: id }, deletedAt: null });

        if (existing) {
            const error = new Error("A farm with this tag already exists");
            error.statusCode = 409;
            throw error;
        }
    }

    const needsPrevious = farmData.crops || farmData.assignedFarmers;
    const previousFarm = needsPrevious
        ? await Farm.findOne({ _id: id, deletedAt: null }).select("crops.crop crops.status assignedFarmers tag")
        : null;

    const farm = await Farm.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: farmData },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE]);

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (farmData.crops) {
        const newCrops = farmData.crops.map((c) => ({
            cropId: c.crop.toString(),
            status: c.status ?? "planted",
        }));
        const previousCropsById = new Map(
            (previousFarm?.crops ?? []).map((c) => [c.crop.toString(), c.status]),
        );

        const addedCropIds = newCrops
            .filter((c) => !previousCropsById.has(c.cropId))
            .map((c) => c.cropId);
        const removedCropIds = [...previousCropsById.keys()].filter(
            (cid) => !newCrops.some((c) => c.cropId === cid),
        );

        if (addedCropIds.length) {
            await Crop.updateMany(
                { _id: { $in: addedCropIds } },
                { $set: { status: "planted" } }
            );
        }

        if (removedCropIds.length) {
            await Crop.updateMany(
                { _id: { $in: removedCropIds } },
                { $set: { status: "not_planted" } }
            );
        }

        const changes = [];
        for (const c of newCrops) {
            const prevStatus = previousCropsById.get(c.cropId);
            if (prevStatus === undefined) {
                changes.push({ cropId: c.cropId, fromStatus: null, toStatus: c.status });
            } else if (prevStatus !== c.status) {
                changes.push({ cropId: c.cropId, fromStatus: prevStatus, toStatus: c.status });
            }
        }

        if (changes.length) {
            const allRelevantCropIds = changes.map((c) => c.cropId);
            const crops = await Crop.find({ _id: { $in: allRelevantCropIds } }).select("name");
            const cropIdToName = new Map(crops.map((c) => [c._id.toString(), c.name]));

            await logCropStatusChanges({ farm, changes, cropIdToName });
        }
    }

    if (farmData.assignedFarmers) {
        const newFarmers = farmData.assignedFarmers.map((a) => ({
            farmerId: a.farmer.toString(),
            classification: a.classification ?? "owner",
        }));
        const previousFarmersById = new Map(
            (previousFarm?.assignedFarmers ?? []).map((a) => [a.farmer.toString(), a.classification]),
        );

        const changes = [];
        for (const nf of newFarmers) {
            const prevClassification = previousFarmersById.get(nf.farmerId);
            if (prevClassification === undefined) {
                changes.push({ farmerId: nf.farmerId, type: "added", toClassification: nf.classification });
            } else if (prevClassification !== nf.classification) {
                changes.push({
                    farmerId: nf.farmerId,
                    type: "classification",
                    fromClassification: prevClassification,
                    toClassification: nf.classification,
                });
            }
        }

        const newFarmerIds = new Set(newFarmers.map((f) => f.farmerId));
        for (const [farmerId] of previousFarmersById) {
            if (!newFarmerIds.has(farmerId)) {
                changes.push({ farmerId, type: "removed" });
            }
        }

        if (changes.length) {
            await logFarmerAssignmentChanges({ farm, changes });
        }
    }

    return filterActiveCrops(farm);
};

export const deleteFarm = async (id) => {
    const farm = await Farm.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    // Crops attached to a deleted farm are orphaned — free them back up.
    if (farm.crops?.length) {
        const cropIds = farm.crops.map((c) => c.crop);
        await Crop.updateMany(
            { _id: { $in: cropIds } },
            { $set: { status: "not_planted" } }
        );
    }

    return farm;
};

export const restoreFarm = async (id) => {
    const toRestore = await Farm.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const tagTaken = await Farm.findOne({
        _id: { $ne: id },
        tag: toRestore.tag,
        deletedAt: null,
    });

    if (tagTaken) {
        const conflictError = new Error("An active farm with this tag already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

export const getFarms = async ({ search, crop, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (associationId) filter.association = associationId;

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ tag: regex }, { address: regex }];
    }

    if (crop) {
        const matchingCropIds = await Crop.find({
            name: new RegExp(escapeRegex(crop), "i"),
            deletedAt: null,
        }).distinct("_id");

        if (!matchingCropIds.length) {
            return all
                ? { farms: [], pagination: null }
                : {
                    farms: [],
                    pagination: { page, limit, total: 0, totalPages: 1 },
                };
        }

        filter.crops = {
            $elemMatch: {
                crop: { $in: matchingCropIds },
            },
        };
    }

    if (all) {
        const farms = await Farm.find(filter)
            .sort({ createdAt: -1 })
            .populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE]);

        return {
            farms: await attachFarmHistory(farms.map(filterActiveCrops), associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farms, total] = await Promise.all([
        Farm.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE]),
        Farm.countDocuments(filter),
    ]);

    return {
        farms: await attachFarmHistory(farms.map(filterActiveCrops), associationId),
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