// Renames report `severity` to `priority` at the top level and inside every
// items[] and cropEntries[] element. Reports only: requests keep `severity`.
// Idempotent: only documents still carrying a `severity` key are matched, and
// when a document already has `priority` that value is kept.

const TOP_LEVEL = { severity: { $exists: true } };
const NESTED = { $or: [{ "items.severity": { $exists: true } }, { "cropEntries.severity": { $exists: true } }] };

// Rebuilds each array element without `severity`, writing its value to
// `priority` (an existing `priority` wins). Elements without `severity`, and
// documents without the array, are left unchanged.
const renameInArray = (field) => ({
    $cond: [
        { $isArray: `$${field}` },
        {
            $map: {
                input: `$${field}`,
                as: "entry",
                in: {
                    $cond: [
                        { $eq: [{ $type: "$$entry.severity" }, "missing"] },
                        "$$entry",
                        {
                            $arrayToObject: {
                                $concatArrays: [
                                    {
                                        $filter: {
                                            input: { $objectToArray: "$$entry" },
                                            as: "pair",
                                            cond: { $not: [{ $in: ["$$pair.k", ["severity", "priority"]] }] },
                                        },
                                    },
                                    [{ k: "priority", v: { $ifNull: ["$$entry.priority", "$$entry.severity"] } }],
                                ],
                            },
                        },
                    ],
                },
            },
        },
        `$${field}`,
    ],
});

export async function runReportPriorityMigration(collection, { apply = false } = {}) {
    const summary = {
        scanned: await collection.countDocuments({}),
        topLevel: await collection.countDocuments(TOP_LEVEL),
        nested: await collection.countDocuments(NESTED),
        applied: { renamed: 0, staleRemoved: 0, nested: 0 },
    };
    if (!apply) return summary;

    const renamed = await collection.updateMany(
        { severity: { $exists: true }, priority: { $exists: false } },
        { $rename: { severity: "priority" } },
    );
    // Already has priority (written by current code): drop the stale key.
    const stale = await collection.updateMany(
        { severity: { $exists: true }, priority: { $exists: true } },
        { $unset: { severity: "" } },
    );
    const nested = await collection.updateMany(NESTED, [
        { $set: { items: renameInArray("items"), cropEntries: renameInArray("cropEntries") } },
    ]);

    summary.applied = { renamed: renamed.modifiedCount, staleRemoved: stale.modifiedCount, nested: nested.modifiedCount };
    summary.remaining = {
        topLevel: await collection.countDocuments(TOP_LEVEL),
        nested: await collection.countDocuments(NESTED),
    };
    return summary;
}
