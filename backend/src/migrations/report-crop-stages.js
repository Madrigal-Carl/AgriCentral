import "../config/env.js";
import mongoose from "mongoose";
import Report from "../models/report.model.js";
import { runReportCropStageMigration } from "../utils/reportCropStageMigration.js";

// Converts stored crop report stage names (cropEntries[].condition and the
// farm report's top-level fallback) to the new stage keys with the legacy
// mapper. Does not deduct seed retroactively: existing unplanted stock is
// already correct.
// Usage: node src/migrations/report-crop-stages.js [--apply]
const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const summary = await runReportCropStageMigration(Report.collection, { apply });
    console.log(apply ? "Report crop stage migration:" : "Report crop stage migration (dry run):", summary);
} catch (error) {
    console.error("Report crop stage migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
