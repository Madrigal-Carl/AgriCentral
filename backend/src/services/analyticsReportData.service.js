import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Farm from "../models/farm.model.js";
import Harvest from "../models/harvest.model.js";
import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";
import Crop from "../models/crop.model.js";

export const PERIOD_LABEL = { week: "This Week", month: "This Month", year: "This Year" };

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

const buildEntityMatch = ({ associationId, start, end }) => ({
    deletedAt: null,
    ...(associationId && { association: associationId }),
    createdAt: { $gte: start, $lte: end },
});

const ENTITY_POPULATE = [
    { path: "association", select: "name" },
    { path: "assignedFarmer", select: "firstName lastName" },
];

export async function getEquipmentRows({ associationId, start, end }) {
    const docs = await Equipment.find(buildEntityMatch({ associationId, start, end }))
        .populate(ENTITY_POPULATE)
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((e) => ({
        propertyNumber: e.propertyNumber,
        name: e.name,
        condition: e.condition,
        status: e.association ? "assigned" : "available",
        association: e.association?.name ?? "",
        assignedFarmer: e.assignedFarmer
            ? `${e.assignedFarmer.firstName} ${e.assignedFarmer.lastName}`
            : "",
        dateAdded: e.createdAt,
    }));
}

export async function getLivestockRows({ associationId, start, end }) {
    const docs = await Livestock.find(buildEntityMatch({ associationId, start, end }))
        .populate(ENTITY_POPULATE)
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((l) => ({
        propertyNumber: l.propertyNumber,
        animal: l.animal,
        breed: l.breed,
        gender: l.gender,
        birthDate: l.birthDate,
        color: l.color,
        weight: l.weight,
        condition: l.condition,
        status: l.association ? "assigned" : "available",
        association: l.association?.name ?? "",
        assignedFarmer: l.assignedFarmer
            ? `${l.assignedFarmer.firstName} ${l.assignedFarmer.lastName}`
            : "",
        dateAdded: l.createdAt,
    }));
}

export async function getFarmRows({ associationId, start, end }) {
    const farmMatch = {
        deletedAt: null,
        ...(associationId && { association: associationId }),
    };

    const farms = await Farm.find(farmMatch)
        .populate({ path: "crops.crop", select: "name" })
        .lean();

    const farmIds = farms.map((f) => f._id);

    const harvestRows = await Harvest.aggregate([
        {
            $match: {
                farm: { $in: farmIds },
                harvestedAt: { $gte: start, $lte: end },
                ...(associationId && { association: associationId }),
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
            const updatedAt = c.updatedAt ? new Date(c.updatedAt) : null;
            const inPeriod = updatedAt && updatedAt >= start && updatedAt <= end;
            const key = `${farm._id}:${c.crop?._id}`;
            const harvestInfo = harvestByKey.get(key);

            if (!inPeriod && !harvestInfo) continue;

            rows.push({
                farm: `${farm.tag} - ${farm.address}`,
                crop: c.crop?.name ?? "Unknown crop",
                planted: c.quantities?.planted ?? 0,
                growing: c.quantities?.growing ?? 0,
                withered: c.quantities?.withered ?? 0,
                damaged: c.quantities?.damaged ?? 0,
                harvested: harvestInfo?.harvested ?? 0,
                plantedDate: c.createdAt,
                harvestedDate: harvestInfo?.lastHarvestedAt ?? null,
            });
        }
    }

    return rows;
}
