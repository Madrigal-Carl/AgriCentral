import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import { createLog, humanize } from "./log.service.js";

const CROP_POPULATE = { path: "crops.crop" };
const FARMER_POPULATE = { path: "assignedFarmers", select: "fullName emailAddress" };

const ACTIVE_CROP_STATUSES = ["planted", "growing"];

function filterActiveCrops(farm) {
    if (!farm) return farm;
    const farmObj = typeof farm.toObject === "function" ? farm.toObject() : farm;
    farmObj.crops = (farmObj.crops ?? []).filter((c) =>
        ACTIVE_CROP_STATUSES.includes(c.status)
    );
    return farmObj;
}

// If the caller explicitly picked an association, use it. Otherwise fall
// back to the authenticated user's own association — the FAR-user path,
// where a farm they register should land under their own association.
const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

// Logs one entry per crop whose status changed (including brand-new crop
// entries, which start at "planted"). cropIdToName resolves display names.
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

// Logs both additions and removals from a farm's assignedFarmers list,
// writing a log entry on each side (the farmer entity and the farm
// entity) so both timelines show the change.
const logFarmerAssignmentChanges = async ({ farm, addedFarmerIds, removedFarmerIds }) => {
    const allIds = [...addedFarmerIds, ...removedFarmerIds];
    if (!allIds.length) return;

    const farmers = await Farmer.find({ _id: { $in: allIds } }).select("fullName");
    const farmerIdToName = new Map(farmers.map((f) => [f._id.toString(), f.fullName]));

    for (const farmerId of addedFarmerIds) {
        const farmerName = farmerIdToName.get(farmerId.toString()) ?? "A farmer";

        await createLog({
            entityType: "farmer",
            entityId: farmerId,
            association: farm.association,
            message: `${farmerName} was assigned to farm ${farm.tag}.`,
        });
        await createLog({
            entityType: "farm",
            entityId: farm._id,
            association: farm.association,
            message: `${farmerName} was assigned to this farm.`,
        });
    }

    for (const farmerId of removedFarmerIds) {
        const farmerName = farmerIdToName.get(farmerId.toString()) ?? "A farmer";

        await createLog({
            entityType: "farmer",
            entityId: farmerId,
            association: farm.association,
            message: `${farmerName} was removed from farm ${farm.tag}.`,
        });
        await createLog({
            entityType: "farm",
            entityId: farm._id,
            association: farm.association,
            message: `${farmerName} was removed from this farm.`,
        });
    }
};

export const createFarm = async (data, authenticatedUserId) => {
    const { associationId, ...farmData } = data;

    const existing = await Farm.findOne({ tag: farmData.tag });

    if (existing) {
        throw new Error("A farm with this tag already exists");
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const farm = await Farm.create({
        ...farmData,
        association: resolvedAssociationId || undefined,
    });

    // A brand-new farm has no "previous" crops, so anything in crops[] here is newly assigned.
    if (farmData.crops?.length) {
        const cropIds = farmData.crops.map((c) => c.crop);
        await Crop.updateMany(
            { _id: { $in: cropIds } },
            { $set: { status: "planted" } }
        );

        const crops = await Crop.find({ _id: { $in: cropIds } }).select("name");
        const cropIdToName = new Map(crops.map((c) => [c._id.toString(), c.name]));

        if (farmData.assignedFarmers?.length) {
            await logFarmerAssignmentChanges({
                farm,
                addedFarmerIds: farmData.assignedFarmers,
                removedFarmerIds: [],
            });
        }
    }

    if (farmData.assignedFarmers?.length) {
        await logNewFarmerAssignments({
            farm,
            newlyAssignedFarmerIds: farmData.assignedFarmers,
        });
    }

    const populated = await farm.populate([FARMER_POPULATE, CROP_POPULATE]);
    return filterActiveCrops(populated);
};

export const updateFarm = async (id, data) => {
    const { associationId, ...farmData } = data;
    if (associationId !== undefined) {
        farmData.association = associationId;
    }

    if (farmData.tag) {
        const existing = await Farm.findOne({ tag: farmData.tag, _id: { $ne: id } });

        if (existing) {
            throw new Error("A farm with this tag already exists");
        }
    }

    // Grab the pre-update state so we can diff both crops and
    // assignedFarmers against it below.
    const needsPrevious = farmData.crops || farmData.assignedFarmers;
    const previousFarm = needsPrevious
        ? await Farm.findById(id).select("crops.crop crops.status assignedFarmers tag")
        : null;

    const farm = await Farm.findByIdAndUpdate(
        id,
        { $set: farmData },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, CROP_POPULATE]);

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

        // Crop removed from this farm — free it back up so it's assignable elsewhere again.
        if (removedCropIds.length) {
            await Crop.updateMany(
                { _id: { $in: removedCropIds } },
                { $set: { status: "not_planted" } }
            );
        }

        // Build the changes list: additions (no previous status) and
        // status transitions on crops that stayed on this farm.
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
        const previousFarmerIds = (previousFarm?.assignedFarmers ?? []).map((f) =>
            f.toString(),
        );
        const newFarmerIds = farmData.assignedFarmers.map((f) => f.toString());

        const addedFarmerIds = newFarmerIds.filter(
            (fid) => !previousFarmerIds.includes(fid),
        );
        const removedFarmerIds = previousFarmerIds.filter(
            (fid) => !newFarmerIds.includes(fid),
        );

        if (addedFarmerIds.length || removedFarmerIds.length) {
            await logFarmerAssignmentChanges({ farm, addedFarmerIds, removedFarmerIds });
        }
    }

    return filterActiveCrops(farm);
};

export const deleteFarm = async (id) => {
    const farm = await Farm.findByIdAndDelete(id);

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

export const getFarms = async ({ search, crop, associationId, all, page, limit }) => {
    const filter = {};

    if (associationId) filter.association = associationId;

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ tag: regex }, { address: regex }];
    }

    if (crop) {
        const matchingCropIds = await Crop.find({
            name: new RegExp(escapeRegex(crop), "i"),
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
            .populate([FARMER_POPULATE, CROP_POPULATE]);

        return {
            farms: farms.map(filterActiveCrops),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farms, total] = await Promise.all([
        Farm.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate([FARMER_POPULATE, CROP_POPULATE]),
        Farm.countDocuments(filter),
    ]);

    return {
        farms: farms.map(filterActiveCrops),
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