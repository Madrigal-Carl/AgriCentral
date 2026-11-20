import { LEGACY_CROP_STAGE_KEYS, toCropStage } from "./cropStages.js";

// Converts crop report stage names stored before the rename to the new keys
// with the legacy mapper: cropEntries[].condition, and a farm report's
// top-level condition (the fallback for entries without their own).
// Nothing else changes: no seed is deducted retroactively, and converted
// reports stay legacy (they still have no stage fields).
// Idempotent: only values still holding an old name are matched.

const LEGACY_FILTER = {
    entityType: "farm",
    $or: [
        { "cropEntries.condition": { $in: LEGACY_CROP_STAGE_KEYS } },
        { condition: { $in: LEGACY_CROP_STAGE_KEYS } },
    ],
};

const isLegacy = (value) => LEGACY_CROP_STAGE_KEYS.includes(value);

export async function runReportCropStageMigration(collection, { apply = false } = {}) {
    const reports = await collection.find(LEGACY_FILTER).project({ condition: 1, cropEntries: 1 }).toArray();
    const operations = [];
    const converted = {};
    const count = (from) => { converted[`${from} -> ${toCropStage(from)}`] = (converted[`${from} -> ${toCropStage(from)}`] ?? 0) + 1; };

    for (const report of reports) {
        const set = {};
        if (isLegacy(report.condition)) {
            count(report.condition);
            set.condition = toCropStage(report.condition);
        }
        if ((report.cropEntries ?? []).some((entry) => isLegacy(entry.condition))) {
            set.cropEntries = report.cropEntries.map((entry) => {
                if (!isLegacy(entry.condition)) return entry;
                count(entry.condition);
                return { ...entry, condition: toCropStage(entry.condition) };
            });
        }
        // Match the values read so a concurrent change is never overwritten.
        operations.push({
            updateOne: {
                filter: { _id: report._id, condition: report.condition ?? null, cropEntries: report.cropEntries ?? null },
                update: { $set: set },
            },
        });
    }

    const summary = { scanned: await collection.countDocuments({ entityType: "farm" }), matched: reports.length, converted };
    if (!apply || !operations.length) return summary;
    const result = await collection.bulkWrite(operations, { ordered: false });
    summary.applied = result.modifiedCount;
    summary.remaining = await collection.countDocuments(LEGACY_FILTER);
    return summary;
}
