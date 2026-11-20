import "../config/env.js";
import mongoose from "mongoose";
import Report from "../models/report.model.js";
import { runReportPriorityMigration } from "../utils/reportPriorityMigration.js";

// Renames report severity -> priority (top level, items[], cropEntries[]).
// Touches the reports collection only; requests keep `severity`.
// Usage: node src/migrations/report-priority.js [--apply]
const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const summary = await runReportPriorityMigration(Report.collection, { apply });
    console.log(apply ? "Report priority migration:" : "Report priority migration (dry run):", summary);
} catch (error) {
    console.error("Report priority migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
