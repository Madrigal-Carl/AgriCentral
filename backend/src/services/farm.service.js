import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";

const CROP_POPULATE = { path: "crops.crop" };
const FARMER_POPULATE = { path: "assignedFarmers.farmer", select: "firstName lastName emailAddress" };
const ASSOCIATION_POPULATE = { path: "association", select: "name" };

function toFarmObject(farm) {
    if (!farm) return farm;
    return typeof farm.toObject === "function" ? farm.toObject() : farm;
}

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

const validateCropQuantities = async (crops, previousPlantedByCropId = new Map()) => {
    if (!crops?.length) return;

    const cropIds = crops.map((c) => c.crop);
    const cropDocs = await Crop.find({ _id: { $in: cropIds } }).select("name unplanted");
    const cropById = new Map(cropDocs.map((c) => [c._id.toString(), c]));

    const claimedByCropId = new Map();

    for (const entry of crops) {
        const cropId = entry.crop.toString();
        const cropDoc = cropById.get(cropId);

        if (!cropDoc) {
            const notFoundError = new Error(`Crop ${cropId} not found`);
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        const rawQuantities = entry.quantities ?? {};
        const planted = rawQuantities.planted ?? 0;
        const dependentStatuses = [
            ["growing", rawQuantities.growing ?? 0],
            ["withered", rawQuantities.withered ?? 0],
            ["harvested", rawQuantities.harvested ?? 0],
            ["damaged", rawQuantities.damaged ?? 0],
        ];

        for (const [statusName, value] of dependentStatuses) {
            if (value > planted) {
                const validationError = new Error(
                    `${humanize(statusName)} quantity for ${cropDoc.name} (${value}) cannot exceed planted quantity (${planted})`
                );
                validationError.statusCode = 400;
                throw validationError;
            }
        }

        claimedByCropId.set(cropId, (claimedByCropId.get(cropId) ?? 0) + planted);
    }

    for (const [cropId, totalPlanted] of claimedByCropId) {
        const cropDoc = cropById.get(cropId);
        const previouslyPlanted = previousPlantedByCropId.get(cropId) ?? 0;
        const availableForThisCrop = cropDoc.unplanted + previouslyPlanted;

        if (totalPlanted > availableForThisCrop) {
            const validationError = new Error(
                `Planted quantity for ${cropDoc.name} (${totalPlanted}) cannot exceed available unplanted stock (${availableForThisCrop})`
            );
            validationError.statusCode = 400;
            throw validationError;
        }
    }
};

const applyCropPlantingDeltas = async (plantedDeltaByCropId) => {
    const ops = [];
    for (const [cropId, delta] of plantedDeltaByCropId) {
        if (!delta) continue;
        ops.push({
            updateOne: {
                filter: { _id: cropId },
                update: { $inc: { unplanted: -delta } },
            },
        });
    }
    if (ops.length) {
        await Crop.bulkWrite(ops);
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

    if (farmData.crops?.length) {
        await validateCropQuantities(farmData.crops);
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const farm = await Farm.create({
        ...farmData,
        association: resolvedAssociationId || undefined,
    });

    await createLog({
        entityType: "farm",
        entityId: farm._id,
        association: farm.association,
        message: `Farm ${farm.tag} was created at ${farm.address}.`,
    });

    if (farmData.crops?.length) {
        const plantedDeltaByCropId = new Map();
        for (const c of farmData.crops) {
            const planted = c.quantities?.planted ?? 0;
            if (planted) {
                const cropId = c.crop.toString();
                plantedDeltaByCropId.set(cropId, (plantedDeltaByCropId.get(cropId) ?? 0) + planted);
            }
        }
        if (plantedDeltaByCropId.size) {
            await applyCropPlantingDeltas(plantedDeltaByCropId);
        }
        // Per-crop status-transition logging was removed along with the
        // `status` field — quantities can now span multiple stages at
        // once, so there's no single "from -> to" transition to narrate
        // per entry anymore.
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
    return toFarmObject(populated);
};

export const updateFarm = async (id, data) => {
    const { associationId, ...farmData } = data;
    if (associationId !== undefined) {
        farmData.association = associationId;
    }

    const needsPrevious = farmData.crops || farmData.assignedFarmers;
    const previousFarm = needsPrevious
        ? await Farm.findOne({ _id: id, deletedAt: null }).select(
            "crops._id crops.crop crops.quantities assignedFarmers tag"
        )
        : null;

    const previousEntries = (previousFarm?.crops ?? []).map((c) => ({
        id: c._id?.toString(),
        cropId: c.crop.toString(),
        planted: c.quantities?.planted ?? 0,
    }));

    // Summed per crop (a crop may have multiple existing entries) — used only
    // for the stock-availability check in validateCropQuantities.
    const previousPlantedByCropId = new Map();
    for (const e of previousEntries) {
        previousPlantedByCropId.set(e.cropId, (previousPlantedByCropId.get(e.cropId) ?? 0) + e.planted);
    }

    if (farmData.crops?.length) {
        await validateCropQuantities(farmData.crops, previousPlantedByCropId);
    }

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
        const previousEntryById = new Map(previousEntries.filter((e) => e.id).map((e) => [e.id, e]));
        const plantedDeltaByCropId = new Map();
        const addDelta = (cropId, delta) => {
            if (!delta) return;
            plantedDeltaByCropId.set(cropId, (plantedDeltaByCropId.get(cropId) ?? 0) + delta);
        };

        const matchedPreviousIds = new Set();
        for (const c of farmData.crops) {
            const cropId = c.crop.toString();
            const newPlanted = c.quantities?.planted ?? 0;
            const entryId = c._id?.toString();
            const previous = entryId ? previousEntryById.get(entryId) : undefined;

            if (previous) {
                matchedPreviousIds.add(entryId);
                addDelta(cropId, newPlanted - previous.planted);
            } else {
                // Brand-new entry: either a genuinely new crop, or a fresh
                // planting cycle for a crop whose earlier entry already
                // finished (fully withered/harvested/damaged).
                addDelta(cropId, newPlanted);
            }
        }

        // Any previous entry that didn't come back gives its planted stock back.
        for (const e of previousEntries) {
            if (e.id && !matchedPreviousIds.has(e.id)) {
                addDelta(e.cropId, -e.planted);
            }
        }

        if (plantedDeltaByCropId.size) {
            await applyCropPlantingDeltas(plantedDeltaByCropId);
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

    return toFarmObject(farm);
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

    // Crops attached to a deleted farm are orphaned — free their planted
    // quantity back into each crop's unplanted stock.
    if (farm.crops?.length) {
        const plantedDeltaByCropId = new Map();
        for (const c of farm.crops) {
            const planted = c.quantities?.planted ?? 0;
            if (planted) {
                const cropId = c.crop.toString();
                plantedDeltaByCropId.set(cropId, (plantedDeltaByCropId.get(cropId) ?? 0) - planted);
            }
        }
        if (plantedDeltaByCropId.size) {
            await applyCropPlantingDeltas(plantedDeltaByCropId);
        }
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
            farms: await attachFarmHistory(farms.map(toFarmObject), associationId),
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
        farms: await attachFarmHistory(farms.map(toFarmObject), associationId),
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