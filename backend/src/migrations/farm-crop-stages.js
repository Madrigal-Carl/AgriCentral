import "../config/env.js";
import mongoose from "mongoose";
import Farm from "../models/farm.model.js";
import { runFarmCropStageMigration } from "../utils/farmCropStageMigration.js";

// Folds legacy Farm.crops[].quantities keys into the new crop stages
// (see LEGACY_FARM_QUANTITY_KEYS in utils/cropStages.js). Harvest records are
// left as they are.
// Usage: node src/migrations/farm-crop-stages.js [--apply]
const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const summary = await runFarmCropStageMigration(Farm.collection, { apply });
    console.log(apply ? "Farm crop stage migration:" : "Farm crop stage migration (dry run):", summary);
} catch (error) {
    console.error("Farm crop stage migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
