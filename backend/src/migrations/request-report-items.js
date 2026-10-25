import "../config/env.js";
import mongoose from "mongoose";
import Request from "../models/request.model.js";
import Report from "../models/report.model.js";
import { inventoryModels, inventoryKey } from "../services/availability.service.js";
import { getReportItems, highestSeverity } from "../utils/reportItems.js";

// Dry-run by default. Stop API/workers and take a backup before --apply.
const apply = process.argv.includes("--apply");

async function migrate() {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
    await mongoose.connect(process.env.MONGO_URI);
    let reports = 0;
    let requests = 0;
    let skipped = 0;
    for await (const report of Report.collection.find({ entityType: { $in: ["equipment", "livestock"] } })) {
        if (report.items?.length) continue;
        const items = getReportItems(report);
        if (!items.length || items.some((entry) => !entry.condition)) {
            console.warn(`Skipped report ${report._id}: missing items/condition; repair manually`);
            skipped++;
            continue;
        }
        if (apply) await Report.collection.updateOne({ _id: report._id }, {
            $set: { items, itemIds: items.map((entry) => entry.item), severity: highestSeverity(items) },
            $unset: { condition: "" },
        });
        reports++;
    }
    for await (const request of Request.collection.find({})) {
        if (request.lines?.length) continue;
        if (request.operationLock) {
            console.warn(`Skipped request ${request._id}: operation lock present; inspect before migrating`);
            skipped++;
            continue;
        }
        const Model = inventoryModels[request.entityType];
        const docs = Model ? await Model.find({ _id: { $in: request.entityIds ?? [] } }).lean() : [];
        if (!docs.length || docs.length !== request.entityIds?.length) {
            console.warn(`Skipped request ${request._id}: missing units; repair manually`);
            skipped++;
            continue;
        }
        const grouped = new Map();
        for (const doc of docs) {
            const key = doc[inventoryKey(request.entityType)];
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
        }
        const releasedIds = request.releaseStatus === "released" ? request.entityIds : docs.filter((doc) =>
            doc.association && String(doc.association) === String(request.association) && String(doc.reservedBy) !== String(request._id),
        ).map((doc) => doc._id);
        const approved = request.approvalStatus?.head?.status === "approved";
        const hasRelease = releasedIds.length > 0 || ["partial", "released"].includes(request.releaseStatus);
        if (!approved && !hasRelease && docs.some((doc) => String(doc.reservedBy) === String(request._id))) {
            console.warn(`Skipped request ${request._id}: reservations exist without head approval; repair manually`);
            skipped++;
            continue;
        }
        if (approved && !hasRelease && docs.some((doc) => String(doc.reservedBy) !== String(request._id))) {
            console.warn(`Request ${request._id}: approved but reservation is missing; inspect manually (revert is safely blocked)`);
        }
        const set = {
            lines: [...grouped].map(([key, quantity]) => ({ key, quantity })),
            releasedIds,
            entityIds: approved || hasRelease ? request.entityIds : [],
        };
        if (releasedIds.length) set.releaseStatus = releasedIds.length === request.entityIds.length ? "released" : "partial";
        if (apply) await Request.collection.updateOne({ _id: request._id }, { $set: set });
        requests++;
    }
    console.log(`${apply ? "Migrated" : "Would migrate"}: ${reports} reports, ${requests} requests; ${skipped} skipped.`);
}

try {
    await migrate();
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
