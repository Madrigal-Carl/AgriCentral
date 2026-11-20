// Backfills dispersedAt on equipment and livestock that belong to an
// association, from the latest release time of the request(s) that released
// them:
//   1. the latest request.releases[] entry listing the item, else
//   2. the latest "released" log on that request (requests released before
//      release entries existed).
// Items with no releasing request (or no recorded release time) keep null.
// Idempotent: only items whose dispersedAt is still empty are written.

const RELEASE_LOG = /has been (fully|partially) released/;

async function releaseTimesByItem(db, entityType) {
    const requests = await db.collection("requests")
        .find({ entityType, releasedIds: { $exists: true, $ne: [] } })
        .project({ releasedIds: 1, releases: 1, association: 1 })
        .toArray();
    const logs = requests.length
        ? await db.collection("logs")
            .find({ entityType: "request", entityId: { $in: requests.map((r) => r._id) }, message: RELEASE_LOG })
            .project({ entityId: 1, createdAt: 1 })
            .toArray()
        : [];
    const latestLog = new Map();
    for (const log of logs) {
        const key = String(log.entityId);
        if (!latestLog.has(key) || log.createdAt > latestLog.get(key)) latestLog.set(key, log.createdAt);
    }

    const times = new Map(); // itemId -> { at, association }
    const keep = (itemId, at, association) => {
        if (!at) return;
        const current = times.get(itemId);
        if (!current || at > current.at) times.set(itemId, { at, association });
    };
    for (const request of requests) {
        for (const itemId of request.releasedIds.map(String)) {
            const entries = (request.releases ?? []).filter((release) => (release.itemIds ?? []).some((id) => String(id) === itemId));
            const fromEntries = entries.reduce((latest, release) => (!latest || release.releasedAt > latest ? release.releasedAt : latest), null);
            keep(itemId, fromEntries ?? latestLog.get(String(request._id)) ?? null, request.association);
        }
    }
    return times;
}

export async function runDispersalMigration(db, { apply = false } = {}) {
    const summary = {};
    for (const [entityType, collectionName] of [["equipment", "equipment"], ["livestock", "livestocks"]]) {
        const collection = db.collection(collectionName);
        const times = await releaseTimesByItem(db, entityType);
        const candidates = await collection
            .find({ association: { $ne: null }, $or: [{ dispersedAt: null }, { dispersedAt: { $exists: false } }] })
            .project({ association: 1 })
            .toArray();
        const updates = [];
        for (const item of candidates) {
            const release = times.get(String(item._id));
            // Only a release into the item's current association counts.
            if (release && String(release.association) === String(item.association)) {
                updates.push({ _id: item._id, dispersedAt: release.at });
            }
        }
        let modified = 0;
        if (apply && updates.length) {
            const result = await collection.bulkWrite(updates.map(({ _id, dispersedAt }) => ({
                updateOne: {
                    filter: { _id, $or: [{ dispersedAt: null }, { dispersedAt: { $exists: false } }] },
                    update: { $set: { dispersedAt } },
                },
            })));
            modified = result.modifiedCount;
        }
        summary[entityType] = {
            associatedWithoutDate: candidates.length,
            backfillable: updates.length,
            leftNull: candidates.length - updates.length,
            ...(apply ? { modified } : {}),
        };
    }
    return summary;
}
