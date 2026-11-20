import "../config/env.js";
import mongoose from "mongoose";
import Livestock from "../models/livestock.model.js";

// Removes the retired `weight` attribute from livestock documents.
// Idempotent: only documents that still carry the field are touched, so
// re-running after a successful apply reports zero changes.
// Usage: node src/migrations/livestock-weight.js [--apply]
const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const filter = { weight: { $exists: true } };
    const summary = { scanned: await Livestock.collection.countDocuments({}), changes: await Livestock.collection.countDocuments(filter), applied: 0 };
    if (apply && summary.changes) {
        const result = await Livestock.collection.updateMany(filter, { $unset: { weight: "" } });
        summary.applied = result.modifiedCount;
    }
    console.log(apply ? "Livestock weight migration:" : "Livestock weight migration (dry run):", summary);
} catch (error) {
    console.error("Livestock weight migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
