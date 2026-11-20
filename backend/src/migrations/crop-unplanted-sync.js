import "../config/env.js";
import mongoose from "mongoose";
import Crop from "../models/crop.model.js";
import { plantedTotals, syncCropUnplanted } from "../utils/cropStock.js";

// Re-derives every government crop's unplanted stock from the farm records
// (quantity given - planted on active farms) and lists crops already planted
// past what was given, which must be lowered on the farm form.
// Usage: node src/migrations/crop-unplanted-sync.js [--apply]
const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const crops = await Crop.find({ ownership: { $ne: "farmer" }, deletedAt: null }).select("name quantity unplanted").lean();
    const totals = await plantedTotals(crops.map((c) => c._id));
    let changed = 0;
    const overPlanted = [];
    for (const crop of crops) {
        const planted = totals.get(String(crop._id)) ?? 0;
        const unplanted = Math.max(0, (crop.quantity ?? 0) - planted);
        if (unplanted !== crop.unplanted) changed += 1;
        if (planted > (crop.quantity ?? 0)) overPlanted.push(`${crop.name} (${crop._id}): given ${crop.quantity}, planted ${planted}`);
    }
    if (apply) await syncCropUnplanted(crops.map((c) => c._id));
    console.log(apply ? "Crop unplanted sync:" : "Crop unplanted sync (dry run):", { crops: crops.length, changed });
    if (overPlanted.length) console.log("Planted past the quantity given (lower these on the farm form):\n  " + overPlanted.join("\n  "));
} catch (error) {
    console.error("Crop unplanted sync failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
