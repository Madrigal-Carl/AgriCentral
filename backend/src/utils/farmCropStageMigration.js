import { LEGACY_FARM_QUANTITY_KEYS } from "./cropStages.js";

// Farm.crops[].quantities: legacy keys fold into the new stages as listed in
// LEGACY_FARM_QUANTITY_KEYS (utils/cropStages.js) and are then removed.
// Idempotent: only farms still carrying a legacy key are matched, and once
// folded the legacy keys are gone, so a second run changes nothing.
// Harvest records are not touched.
const LEGACY_KEYS = Object.keys(LEGACY_FARM_QUANTITY_KEYS);
const LEGACY_FILTER = { $or: LEGACY_KEYS.map((key) => ({ [`crops.quantities.${key}`]: { $exists: true } })) };

// Sum that stays null when both sides are missing/null (matching the
// schema's "not entered" default).
const addNullable = (a, b) => ({
    $cond: [
        { $and: [{ $eq: [{ $ifNull: [a, null] }, null] }, { $eq: [{ $ifNull: [b, null] }, null] }] },
        null,
        { $add: [{ $ifNull: [a, 0] }, { $ifNull: [b, 0] }] },
    ],
});

// For every crop entry: drop the legacy keys and the keys they fold into,
// then append the folded values (new key = new key + legacy key).
const FOLDED_KEYS = [...LEGACY_KEYS, ...new Set(Object.values(LEGACY_FARM_QUANTITY_KEYS))];
const foldedValues = {};
for (const [legacyKey, key] of Object.entries(LEGACY_FARM_QUANTITY_KEYS)) {
    foldedValues[key] = addNullable(foldedValues[key] ?? `$$entry.quantities.${key}`, `$$entry.quantities.${legacyKey}`);
}

const foldedCrops = {
    $map: {
        input: "$crops",
        as: "entry",
        in: {
            $mergeObjects: ["$$entry", {
                quantities: {
                    $arrayToObject: {
                        $concatArrays: [
                            {
                                $filter: {
                                    input: { $objectToArray: { $ifNull: ["$$entry.quantities", {}] } },
                                    as: "pair",
                                    cond: { $not: [{ $in: ["$$pair.k", FOLDED_KEYS] }] },
                                },
                            },
                            Object.entries(foldedValues).map(([k, v]) => ({ k, v })),
                        ],
                    },
                },
            }],
        },
    },
};

export async function runFarmCropStageMigration(collection, { apply = false } = {}) {
    const summary = {
        scanned: await collection.countDocuments({}),
        withLegacyKeys: await collection.countDocuments(LEGACY_FILTER),
        applied: 0,
    };
    if (!apply) return summary;

    const result = await collection.updateMany(LEGACY_FILTER, [{ $set: { crops: foldedCrops } }]);
    summary.applied = result.modifiedCount;
    summary.remaining = await collection.countDocuments(LEGACY_FILTER);
    return summary;
}
