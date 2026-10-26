import "../config/env.js";
import mongoose from "mongoose";
import Report from "../models/report.model.js";
import { buildFarmReportMigration } from "../utils/farmReportMigration.js";
import { hasFarmReportMeasurements } from "../utils/farmReportTotals.js";

const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const summary = { scanned: 0, changes: 0, applied: 0, needsMeasurements: 0 };
    for await (const report of Report.collection.find({ entityType: "farm" })) {
        summary.scanned++;
        if (!hasFarmReportMeasurements(report)) summary.needsMeasurements++;
        const update = buildFarmReportMigration(report);
        if (!update) continue;
        summary.changes++;
        if (apply) {
            const result = await Report.collection.updateOne({ _id: report._id, updatedAt: report.updatedAt, operationLock: null }, update);
            summary.applied += result.modifiedCount;
        }
    }
    if (apply) await Report.createIndexes();
    console.log(apply ? "Farm report migration:" : "Farm report migration (dry run):", summary);
} catch (error) {
    console.error("Farm report migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
