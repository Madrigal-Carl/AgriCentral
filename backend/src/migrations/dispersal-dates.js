import "../config/env.js";
import mongoose from "mongoose";
import { runDispersalMigration } from "../utils/dispersalMigration.js";

// Backfills equipment/livestock dispersedAt from the latest release time of
// the request that released them. Idempotent; dry run unless --apply.
// Usage: node src/migrations/dispersal-dates.js [--apply]
const apply = process.argv.includes("--apply");
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

try {
    await mongoose.connect(process.env.MONGO_URI);
    const summary = await runDispersalMigration(mongoose.connection.db, { apply });
    console.log(apply ? "Dispersal date migration:" : "Dispersal date migration (dry run):", summary);
} catch (error) {
    console.error("Dispersal date migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
