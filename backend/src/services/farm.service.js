import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { validateLocation, LOCATION_POPULATE, CROP_TYPE_POPULATE } from "../utils/maintenanceLinks.js";
import HarvestLog from "../models/harvest.model.js";
import Report from "../models/report.model.js";
import { APPROVED_FARM_REPORT_FILTER, deriveFarmReportTotals } from "../utils/farmReportTotals.js";
import {
    CROP_STAGE_LABELS,
    FARM_CROP_QUANTITY_KEYS,
    dominantCropStage,
    readFarmCropQuantities,
    stageQuantityTotal,
} from "../utils/cropStages.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import { plantedTotals, syncCropUnplanted } from "../utils/cropStock.js";

const CROP_POPULATE = { path: "crops.crop", populate: CROP_TYPE_POPULATE };
const FARMER_POPULATE = { path: "assignedFarmers.farmer", select: "firstName lastName emailAddress" };
const ASSOCIATION_POPULATE = { path: "association", select: "name" };

// Stored quantities with nulls as 0; legacy keys are folded in by the mapper.
const quantitiesOf = (quantities) => {
    const read = readFarmCropQuantities(quantities);
    return Object.fromEntries(FARM_CROP_QUANTITY_KEYS.map((key) => [key, read[key] ?? 0]));
};

const badRequest = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

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

// The farm record is the source of planted and stage quantities; crop
// reports only record what was reported and never change them, and neither
// moves crop stock. Planted is entered first; stages are recorded against
// the saved planted quantity and never exceed it.
// previousEntriesById: the farm's stored entries (by entry id) when editing.
// assignedFarmerIds: the farm's farmers after this write (undefined = skip
// the farmer-owned assignment check). farmId: the farm being edited, if any.
const validateCropQuantities = async (crops, previousEntriesById = new Map(), { assignedFarmerIds, farmId } = {}) => {
    if (!crops?.length) return;

    const cropIds = crops.map((c) => c.crop);
    const cropDocs = await Crop.find({ _id: { $in: cropIds } }).select("name ownership assignedFarmer");
    const cropById = new Map(cropDocs.map((c) => [c._id.toString(), c]));

    for (const entry of crops) {
        const cropId = entry.crop.toString();
        const cropDoc = cropById.get(cropId);

        if (!cropDoc) {
            const notFoundError = new Error(`Crop ${cropId} not found`);
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        const quantities = entry.quantities ?? {};
        const planted = quantities.planted ?? 0;
        const staged = stageQuantityTotal(quantities);
        if (staged > planted) {
            throw badRequest(`Stage quantities for ${cropDoc.name} (${staged}) cannot exceed planted quantity (${planted})`);
        }

        // Planting comes first: stages can only be recorded against a planted
        // quantity that is already saved on this entry (a new entry has none).
        const previous = entry._id ? previousEntriesById.get(String(entry._id)) : undefined;
        const storedPlanted = previous && String(previous.cropId) === cropId ? previous.quantities.planted : 0;
        if (staged > 0 && storedPlanted <= 0) {
            throw badRequest(`Save a planted quantity for ${cropDoc.name} before recording its stages`);
        }
        if (staged > storedPlanted) {
            throw badRequest(`Stage quantities for ${cropDoc.name} (${staged}) cannot exceed its saved planted quantity (${storedPlanted})`);
        }

        // Planted is a free whole number for every crop.
        if (!Number.isInteger(planted) || planted < 0) {
            throw badRequest(`Planted quantity for ${cropDoc.name} must be a whole number`);
        }

        if (cropDoc.ownership === "farmer") {
            if (assignedFarmerIds && !assignedFarmerIds.includes(String(cropDoc.assignedFarmer))) {
                throw badRequest(`${cropDoc.name} is farmer-owned and its farmer must be assigned to this farm`);
            }
            const elsewhere = await Farm.exists({ _id: { $ne: farmId }, deletedAt: null, "crops.crop": cropDoc._id });
            if (elsewhere) throw badRequest(`${cropDoc.name} is farmer-owned and already belongs to another farm`);
        }
    }
};

const idOf = (value) => String(value?._id ?? value ?? "");

// Planting a government crop uses the batch given to its farmer: across all
// active farms, its planted total can never exceed Crop.quantity (given 100,
// at most 100 planted). Totals come from the farm records, never from the
// stored Crop.unplanted copy, which is re-synced after every save.
// Only crops whose planted goes up on this farm are checked, so lowering
// planted is always allowed. Farmer-owned crops have no given quantity.
const assertWithinGivenQuantity = async (nextCrops, previousEntries, farmId) => {
    const next = new Map();
    for (const c of nextCrops ?? []) {
        const cropId = String(c.crop);
        next.set(cropId, (next.get(cropId) ?? 0) + (c.quantities?.planted ?? 0));
    }
    const before = new Map();
    for (const e of previousEntries) before.set(e.cropId, (before.get(e.cropId) ?? 0) + (e.quantities.planted ?? 0));
    const raised = [...next].filter(([cropId, planted]) => planted > (before.get(cropId) ?? 0)).map(([cropId]) => cropId);
    if (!raised.length) return;

    const crops = await Crop.find({ _id: { $in: raised }, ownership: { $ne: "farmer" } }).select("name quantity").lean();
    const elsewhere = await plantedTotals(crops.map((c) => c._id), { excludeFarmId: farmId });
    for (const crop of crops) {
        const cropId = String(crop._id);
        const given = crop.quantity ?? 0;
        const otherFarms = elsewhere.get(cropId) ?? 0;
        const allowed = Math.max(0, given - otherFarms);
        if (next.get(cropId) > allowed) {
            throw badRequest(
                `${crop.name} only has ${given} given to the farmer`
                + (otherFarms ? ` (${otherFarms} already planted on other farms)` : "")
                + `, so this farm can plant at most ${allowed}.`,
            );
        }
    }
};

// Fully approved crop report totals for these farms (one report query and one
// crop query, never per farm). Reports only count for their own association.
const loadFarmReportTotals = async (farms) => {
    if (!farms.length) return { reportTotals: new Map(), crops: [] };
    const reports = await Report.find({
        ...APPROVED_FARM_REPORT_FILTER,
        parentId: { $in: farms.map((farm) => farm._id) },
    }).select("parentId association entityType condition itemIds cropEntries reportedAt createdAt approvalStatus deletedAt").lean();
    const farmAssociations = new Map(farms.map((farm) => [idOf(farm), idOf(farm.association)]));
    const scopedReports = reports.filter((report) => String(report.association) === farmAssociations.get(String(report.parentId)));
    const cropIds = [...new Set([
        ...scopedReports.flatMap((report) => report.itemIds.map(String)),
        ...farms.flatMap((farm) => (farm.crops ?? []).map((entry) => idOf(entry.crop))),
    ])];
    const crops = cropIds.length
        ? await Crop.find({ _id: { $in: cropIds } }).select("name cropType ownership").populate(CROP_TYPE_POPULATE).lean()
        : [];
    return { reportTotals: deriveFarmReportTotals(scopedReports, crops), crops };
};

// Per farm: cropReportTotals[cropId] = { stage, plantedQuantity, latestAreaHa, yieldKg }.
const attachCropReportTotals = async (farms) => {
    const { reportTotals } = await loadFarmReportTotals(farms);
    return farms.map((farm) => ({
        ...farm,
        cropReportTotals: Object.fromEntries(
            [...(reportTotals.get(idOf(farm)) ?? new Map())].map(([cropId, { stage, plantedQuantity, latestAreaHa, yieldKg }]) => [cropId, { stage, plantedQuantity, latestAreaHa, yieldKg }]),
        ),
    }));
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
// Only the farm-level log of each change notifies (the farmer log mirrors
// it); notify: false silences both when a parent log covers the action.
const logFarmerAssignmentChanges = async ({ farm, changes, notify = true }) => {
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
                notify: false,
                message: `${farmerName} was assigned to farm ${farm.tag} as ${classificationLabel}.`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                notify,
                message: `${farmerName} was assigned to this farm as ${classificationLabel}.`,
            });
        } else if (change.type === "removed") {
            await createLog({
                entityType: "farmer",
                entityId: change.farmerId,
                association: farm.association,
                notify: false,
                message: `${farmerName} was removed from farm ${farm.tag}.`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                notify,
                message: `${farmerName} was removed from this farm.`,
            });
        } else if (change.type === "classification") {
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                notify,
                message: `${farmerName}'s classification on ${farm.tag} changed from ${humanize(change.fromClassification)} to ${humanize(change.toClassification)}.`,
            });
        }
    }
};

// Same as above: the crop log mirrors the farm-level log of each change.
const logCropQuantityChanges = async ({ farm, changes, notify = true }) => {
    if (!changes.length) return;

    const cropIds = [...new Set(changes.map((c) => c.cropId))];
    const crops = await Crop.find({ _id: { $in: cropIds } }).select("name");
    const cropIdToName = new Map(crops.map((c) => [c._id.toString(), c.name]));

    for (const change of changes) {
        const cropName = cropIdToName.get(change.cropId) ?? "A crop";

        if (change.type === "planted") {
            await createLog({
                entityType: "crop",
                entityId: change.cropId,
                association: farm.association,
                notify: false,
                message: `${change.quantity} unit(s) were planted on farm ${farm.tag}.`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                notify,
                message: `${change.quantity} unit(s) of ${cropName} were planted on this farm.`,
            });
        } else if (change.type === "quantity") {
            const statusLabel = humanize(change.status).toLowerCase();

            await createLog({
                entityType: "crop",
                entityId: change.cropId,
                association: farm.association,
                notify: false,
                message: `${statusLabel} quantity on farm ${farm.tag} changed from ${change.from} to ${change.to}.`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                notify,
                message: `${cropName}'s ${statusLabel} quantity changed from ${change.from} to ${change.to}.`,
            });
        } else if (change.type === "removed") {
            await createLog({
                entityType: "crop",
                entityId: change.cropId,
                association: farm.association,
                notify: false,
                message: `${change.quantity} unit(s) were removed from farm ${farm.tag} (planting cycle ended).`,
            });
            await createLog({
                entityType: "farm",
                entityId: farm._id,
                association: farm.association,
                notify,
                message: `${change.quantity} unit(s) of ${cropName} were removed from this farm (planting cycle ended).`,
            });
        }
    }
};

// entries: array of { cropId, quantity } — quantity is the harvested delta
// introduced by this edit (positive for a new harvest, negative for a
// downward correction). Always inserts new documents rather than updating
// an existing one, so the collection stays a per-event history that can be
// accurately grouped by month later, instead of a cumulative snapshot.
const logHarvestEntries = async ({ farm, entries }) => {
    if (!entries.length) return;

    await HarvestLog.insertMany(
        entries.map((e) => ({
            farm: farm._id,
            association: farm.association,
            crop: e.cropId,
            quantity: e.quantity,
        }))
    );
};

export const createFarm = async (data, authenticatedUserId) => {
    const { associationId, ...farmData } = data;
    await validateLocation(farmData);

    if (farmData.crops?.length) {
        await validateCropQuantities(farmData.crops, new Map(), {
            assignedFarmerIds: (farmData.assignedFarmers ?? []).map((a) => String(a.farmer)),
        });
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    await assertWithinGivenQuantity(farmData.crops, []);

    const farm = await Farm.create({
        ...farmData,
        association: resolvedAssociationId || undefined,
    });
    await syncCropUnplanted((farmData.crops ?? []).map((c) => c.crop));

    await createLog({
        entityType: "farm",
        entityId: farm._id,
        association: farm.association,
        message: `Farm ${farm.tag} was created at ${farm.address}.`,
    });

    if (farmData.crops?.length) {
        const cropChanges = [];
        const harvestEntries = [];

        for (const c of farmData.crops) {
            const cropId = c.crop.toString();
            const planted = c.quantities?.planted ?? 0;
            const harvested = c.quantities?.harvested ?? 0;

            if (planted) {
                cropChanges.push({ cropId, type: "planted", quantity: planted });
            }

            if (harvested) {
                harvestEntries.push({ cropId, quantity: harvested });
            }
        }

        if (cropChanges.length) {
            // "Farm was created" already notifies for this action.
            await logCropQuantityChanges({ farm, changes: cropChanges, notify: false });
        }

        if (harvestEntries.length) {
            await logHarvestEntries({ farm, entries: harvestEntries });
        }
    }

    if (farmData.assignedFarmers?.length) {
        await logFarmerAssignmentChanges({
            farm,
            notify: false,
            changes: farmData.assignedFarmers.map((a) => ({
                farmerId: a.farmer.toString(),
                type: "added",
                toClassification: a.classification ?? "owner",
            })),
        });
    }

    const populated = await farm.populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE, ...LOCATION_POPULATE]);
    return toFarmObject(populated);
};

export const updateFarm = async (id, data) => {
    const { associationId, ...farmData } = data;
    if (["municipality", "barangay", "street"].some((key) => data[key] !== undefined)) await validateLocation(farmData, await Farm.findById(id) ?? {});
    if (associationId !== undefined) {
        farmData.association = associationId;
    }

    const needsPrevious = farmData.crops || farmData.assignedFarmers;
    const previousFarm = needsPrevious
        ? await Farm.findOne({ _id: id, deletedAt: null }).select(
            "crops._id crops.crop crops.quantities assignedFarmers tag"
        ).lean()
        : null;

    // Lean so quantities stored under legacy keys are still readable here.
    const previousEntries = (previousFarm?.crops ?? []).map((c) => ({
        id: c._id?.toString(),
        cropId: c.crop.toString(),
        quantities: quantitiesOf(c.quantities),
    }));

    const previousEntriesById = new Map(previousEntries.filter((e) => e.id).map((e) => [e.id, e]));

    if (farmData.crops?.length) {
        const farmers = farmData.assignedFarmers ?? previousFarm?.assignedFarmers ?? [];
        await validateCropQuantities(farmData.crops, previousEntriesById, {
            assignedFarmerIds: farmers.map((a) => String(a.farmer)),
            farmId: id,
        });
    }

    if (farmData.crops) await assertWithinGivenQuantity(farmData.crops, previousEntries, id);

    const farm = await Farm.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: farmData },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE, ...LOCATION_POPULATE]);

    if (farm && farmData.crops) {
        await syncCropUnplanted([...previousEntries.map((e) => e.cropId), ...farmData.crops.map((c) => c.crop)]);
    }

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (farmData.crops) {
        const cropChanges = [];
        const harvestEntries = [];

        const matchedPreviousIds = new Set();
        for (const c of farmData.crops) {
            const cropId = c.crop.toString();
            const newQuantities = quantitiesOf(c.quantities);
            const entryId = c._id?.toString();
            const previous = entryId ? previousEntriesById.get(entryId) : undefined;

            if (previous) {
                matchedPreviousIds.add(entryId);

                for (const status of FARM_CROP_QUANTITY_KEYS) {
                    const from = previous.quantities[status];
                    const to = newQuantities[status];
                    if (from !== to) {
                        cropChanges.push({ cropId, type: "quantity", status, from, to });

                        if (status === "harvested") {
                            harvestEntries.push({ cropId, quantity: to - from });
                        }
                    }
                }
            } else {
                // Brand-new entry: either a genuinely new crop, or a fresh
                // planting cycle for a crop whose earlier entry already
                // finished (fully harvested/damaged).
                if (newQuantities.planted) {
                    cropChanges.push({ cropId, type: "planted", quantity: newQuantities.planted });
                }
                if (newQuantities.harvested) {
                    harvestEntries.push({ cropId, quantity: newQuantities.harvested });
                }
            }
        }

        // Removed entries are logged. Their historical harvested quantity is
        // left untouched in the harvest log — that harvest genuinely happened,
        // even though the crop cycle entry itself is now gone from the farm.
        for (const e of previousEntries) {
            if (e.id && !matchedPreviousIds.has(e.id)) {
                if (e.quantities.planted) {
                    cropChanges.push({ cropId: e.cropId, type: "removed", quantity: e.quantities.planted });
                }
            }
        }

        if (cropChanges.length) {
            await logCropQuantityChanges({ farm, changes: cropChanges });
        }

        if (harvestEntries.length) {
            await logHarvestEntries({ farm, entries: harvestEntries });
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

    // A deleted farm's planting no longer counts against its crops.
    await syncCropUnplanted((farm.crops ?? []).map((c) => c.crop));
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
    await syncCropUnplanted((toRestore.crops ?? []).map((c) => c.crop));
    return toRestore;
};

export const getFarmMap = async ({ search, crop, associationId }) => {
    const filter = { deletedAt: null };
    if (associationId) filter.association = associationId;
    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ tag: regex }, { address: regex }];
    }
    const farms = await Farm.find(filter)
        .select("tag address latitude longitude association assignedFarmers crops.crop crops.quantities")
        .sort({ createdAt: -1 })
        .populate([FARMER_POPULATE, ASSOCIATION_POPULATE])
        .then((docs) => docs.map(toFarmObject)); // keeps farmer.fullName virtuals
    if (!farms.length) return { farms: [] };

    const { reportTotals, crops } = await loadFarmReportTotals(farms);
    const cropById = new Map(crops.map((doc) => [String(doc._id), doc]));

    const mapped = farms.map((farm) => {
        const farmId = String(farm._id);
        const totals = reportTotals.get(farmId) ?? new Map();

        // A crop may have several entries on a farm (replanting cycles).
        const quantitiesByCropId = new Map();
        for (const entry of farm.crops ?? []) {
            const cropId = String(entry.crop);
            const quantities = quantitiesOf(entry.quantities);
            const previous = quantitiesByCropId.get(cropId);
            quantitiesByCropId.set(cropId, previous
                ? Object.fromEntries(FARM_CROP_QUANTITY_KEYS.map((key) => [key, previous[key] + quantities[key]]))
                : quantities);
        }

        const lines = [...new Set([...quantitiesByCropId.keys(), ...totals.keys()])]
            .filter((cropId) => cropById.get(cropId)?.cropType)
            .map((cropId) => {
                const doc = cropById.get(cropId);
                const quantities = quantitiesByCropId.get(cropId);
                const total = totals.get(cropId);
                // Latest fully approved report, else the largest stored stage, else newly planted.
                const stage = total?.stage ?? (quantities && dominantCropStage(quantities)) ?? "newly_planted";
                return {
                    crop: cropId,
                    cropType: String(doc.cropType._id ?? doc.cropType),
                    name: doc.name ?? doc.cropType.name ?? "Unknown crop",
                    ownership: doc.ownership ?? "government",
                    stage,
                    stageLabel: CROP_STAGE_LABELS[stage] ?? stage,
                    planted: quantities?.planted ?? 0,
                    plantedQuantity: total?.plantedQuantity ?? 0,
                    latestAreaHa: total?.latestAreaHa ?? null,
                    yieldKg: total?.yieldKg ?? 0,
                };
            })
            .sort((a, b) => b.yieldKg - a.yieldKg || b.planted - a.planted || a.name.localeCompare(b.name));

        return { ...farm, crops: lines, yieldKg: [...totals.values()].reduce((sum, total) => sum + total.yieldKg, 0) };
    });
    return { farms: crop ? mapped.filter((farm) => farm.crops.some((entry) => entry.cropType === crop)) : mapped };
};

export const getFarms = async ({ id, search, crop, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (id) filter._id = id;

    if (associationId) filter.association = associationId;

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ tag: regex }, { address: regex }];
    }

    if (crop) {
        const matchingCropIds = await Crop.find({
            cropType: crop,
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
            .populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE, ...LOCATION_POPULATE]);

        return {
            farms: await attachFarmHistory(await attachCropReportTotals(farms.map(toFarmObject)), associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farms, total] = await Promise.all([
        Farm.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate([FARMER_POPULATE, CROP_POPULATE, ASSOCIATION_POPULATE, ...LOCATION_POPULATE]),
        Farm.countDocuments(filter),
    ]);

    return {
        farms: await attachFarmHistory(await attachCropReportTotals(farms.map(toFarmObject)), associationId),
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
