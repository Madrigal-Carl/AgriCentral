import mongoose from "mongoose";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Farm from "../models/farm.model.js";
import Harvest from "../models/harvest.model.js";
import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";
import Crop from "../models/crop.model.js";
import { EQUIPMENT_TYPE_POPULATE, ANIMAL_POPULATE, CROP_TYPE_POPULATE, LOCATION_POPULATE } from "../utils/maintenanceLinks.js";
import { newlyPlantedQuantity, readFarmCropQuantities } from "../utils/cropStages.js";
import { currentYear, getDateRange, getYearBounds, normalizePeriod } from "../utils/dateRange.util.js";
import { formatDispersalAge } from "../utils/dispersal.js";

export const PERIOD_LABEL = { week: "This Week", month: "This Month", year: "This Year" };

// "This Year" only for the current year; a past year is its full year.
export const periodLabel = (period, year = currentYear()) =>
    year === currentYear() ? PERIOD_LABEL[period] ?? "Period" : `Full Year ${year}`;

/* ---------------- Analytics scope (association, farmer, year) ---------------- */

// Resolves the query filters once for the analytics page and both exports:
// ids, the selected year's date range, and (with a farmer) the farmer's crops.
export async function resolveAnalyticsScope({ association, farmer, period = "month", year = currentYear() } = {}) {
    const associationId = association ? new mongoose.Types.ObjectId(association) : null;
    const farmerId = farmer ? new mongoose.Types.ObjectId(farmer) : null;
    const normalizedPeriod = normalizePeriod(period, year);
    const { start, end } = getDateRange(normalizedPeriod, year);
    // Harvests and crop quantities with a farmer: crops assigned to that
    // farmer (Harvest joined to Crop through these ids).
    const farmerCropIds = farmerId ? await Crop.find({ assignedFarmer: farmerId }).distinct("_id") : null;
    return {
        associationId,
        farmerId,
        farmerCropIds,
        year,
        period: normalizedPeriod,
        start,
        end,
        ...getYearBounds(year),
    };
}

// Equipment and livestock: association and/or assigned farmer.
export const entityScopeMatch = ({ associationId, farmerId }) => ({
    ...(associationId && { association: associationId }),
    ...(farmerId && { assignedFarmer: farmerId }),
});

// Farms: association and/or one of the farm's assigned farmers.
export const farmScopeMatch = ({ associationId, farmerId }) => ({
    ...(associationId && { association: associationId }),
    ...(farmerId && { "assignedFarmers.farmer": farmerId }),
});

// Harvests: their association snapshot and/or the farmer's crops.
export const harvestScopeMatch = ({ associationId, farmerCropIds }) => ({
    ...(associationId && { association: associationId }),
    ...(farmerCropIds && { crop: { $in: farmerCropIds } }),
});

// Names for the export header.
export async function describeAnalyticsScope({ associationId, farmerId }) {
    const [association, farmer] = await Promise.all([
        associationId ? Association.findById(associationId).select("name").lean() : null,
        farmerId ? Farmer.findById(farmerId) : null,
    ]);
    return {
        associationName: associationId ? association?.name ?? "Unknown association" : "All Associations",
        farmerName: farmerId ? farmer?.getFullName?.() ?? "Unknown farmer" : "All Farmers",
    };
}

export async function exportHeaderLines(scope) {
    const { associationName, farmerName } = await describeAnalyticsScope(scope);
    return {
        scopeLine: `Association: ${associationName} • Farmer: ${farmerName} • Year: ${scope.year}`,
        periodLine: `${periodLabel(scope.period, scope.year)} • ${formatDate(scope.start)} – ${formatDate(scope.end)}`,
    };
}

/* ---------------- Helpers ---------------- */
export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/* ---------------- Data fetchers ---------------- */

const buildEntityMatch = ({ associationId, farmerId, start, end }) => ({
    deletedAt: null,
    ...entityScopeMatch({ associationId, farmerId }),
    createdAt: { $gte: start, $lte: end },
});

const ENTITY_POPULATE = [
    { path: "association", select: "name" },
    { path: "assignedFarmer", select: "firstName lastName" },
];

export async function getEquipmentRows({ associationId, farmerId, start, end }) {
    const docs = await Equipment.find(buildEntityMatch({ associationId, farmerId, start, end }))
        .populate([...ENTITY_POPULATE, EQUIPMENT_TYPE_POPULATE])
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((e) => ({
        propertyNumber: e.propertyNumber,
        name: e.equipmentType?.name ?? e.name,
        condition: e.condition,
        status: e.association ? "assigned" : "available",
        association: e.association?.name ?? "",
        assignedFarmer: e.assignedFarmer
            ? `${e.assignedFarmer.firstName} ${e.assignedFarmer.lastName}`
            : "",
        dispersalDate: e.dispersedAt ?? null,
        dateAdded: e.createdAt,
    }));
}

export async function getLivestockRows({ associationId, farmerId, start, end }) {
    const docs = await Livestock.find(buildEntityMatch({ associationId, farmerId, start, end }))
        .populate([...ENTITY_POPULATE, ...ANIMAL_POPULATE])
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((l) => ({
        propertyNumber: l.propertyNumber,
        animal: l.animalType?.name ?? l.animal,
        breed: l.breed?.name ?? "",
        gender: l.gender,
        birthDate: l.birthDate,
        color: l.color?.name ?? "",
        condition: l.condition,
        status: l.association ? "assigned" : "available",
        association: l.association?.name ?? "",
        assignedFarmer: l.assignedFarmer
            ? `${l.assignedFarmer.firstName} ${l.assignedFarmer.lastName}`
            : "",
        dispersalDate: l.dispersedAt ?? null,
        // Shared helper (prompt 9); blank when not dispersed.
        dispersalAge: l.dispersedAt ? formatDispersalAge(l.birthDate, l.dispersedAt) : "",
        dateAdded: l.createdAt,
    }));
}

export async function getFarmRows({ associationId, farmerId, farmerCropIds, start, end }) {
    const farmMatch = {
        deletedAt: null,
        ...farmScopeMatch({ associationId, farmerId }),
    };
    const farmerCrops = farmerCropIds ? new Set(farmerCropIds.map(String)) : null;

    const farms = await Farm.find(farmMatch)
        .populate({ path: "crops.crop", select: "name cropType", populate: CROP_TYPE_POPULATE }).populate(LOCATION_POPULATE)
        .lean();

    const farmIds = farms.map((f) => f._id);

    const harvestRows = await Harvest.aggregate([
        {
            $match: {
                farm: { $in: farmIds },
                harvestedAt: { $gte: start, $lte: end },
                ...harvestScopeMatch({ associationId, farmerCropIds }),
            },
        },
        {
            $group: {
                _id: { farm: "$farm", crop: "$crop" },
                harvested: { $sum: "$quantity" },
                lastHarvestedAt: { $max: "$harvestedAt" },
            },
        },
    ]);

    const harvestByKey = new Map(
        harvestRows.map((r) => [
            `${r._id.farm}:${r._id.crop}`,
            { harvested: r.harvested, lastHarvestedAt: r.lastHarvestedAt },
        ]),
    );

    const rows = [];
    for (const farm of farms) {
        for (const c of farm.crops ?? []) {
            // With a farmer selected, only crops assigned to that farmer.
            if (farmerCrops && !farmerCrops.has(String(c.crop?._id ?? c.crop))) continue;
            const updatedAt = c.updatedAt ? new Date(c.updatedAt) : null;
            const inPeriod = updatedAt && updatedAt >= start && updatedAt <= end;
            const key = `${farm._id}:${c.crop?._id}`;
            const harvestInfo = harvestByKey.get(key);

            if (!inPeriod && !harvestInfo) continue;

            const quantities = readFarmCropQuantities(c.quantities);
            rows.push({
                farm: `${farm.tag} - ${farm.address}`,
                crop: c.crop?.cropType?.name ?? c.crop?.name ?? "Unknown crop",
                planted: quantities.planted ?? 0,
                newlyPlanted: newlyPlantedQuantity(quantities),
                flowering: quantities.flowering ?? 0,
                reproductive: quantities.reproductive ?? 0,
                vegetative: quantities.vegetative ?? 0,
                damaged: quantities.damaged ?? 0,
                harvested: harvestInfo?.harvested ?? 0,
                plantedDate: c.createdAt,
                harvestedDate: harvestInfo?.lastHarvestedAt ?? null,
            });
        }
    }

    return rows;
}
