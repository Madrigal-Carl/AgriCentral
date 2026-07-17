import "./config/env.js";
import mongoose from "mongoose";

import { wipeAssociations, seedAssociations } from "./seeders/association.seeder.js";
import { wipeUsers, seedUsers } from "./seeders/user.seeder.js";
import { wipeFarmers, seedFarmers } from "./seeders/farmer.seeder.js";
import { wipeCrops, seedCrops } from "./seeders/crop.seeder.js";
import { wipeFarms, seedFarms } from "./seeders/farm.seeder.js";
import { wipeLivestocks, seedLivestocks } from "./seeders/livestock.seeder.js";
import { wipeEquipments, seedEquipments } from "./seeders/equipment.seeder.js";
import { wipeReports, seedReports } from "./seeders/report.seeder.js";
import { wipeLogs, seedLogs } from "./seeders/log.seeder.js";
import { wipeRequests, seedRequests } from "./seeders/request.seeder.js";

// Order matters: each entry is listed after every seeder whose output it
// depends on, so foreign keys always point at documents that already
// exist by the time they're referenced.
//
//   Associations -> no dependencies
//   Users        -> no dependencies (seeded with association: null)
//   Farmers      -> needs Associations
//   Crops        -> needs Farmers (association is copied from the farmer)
//   Farms        -> needs Associations, Farmers, Crops
//   Livestock    -> needs Farmers
//   Equipment    -> needs Farmers
//   Reports      -> wipe-only for now; needs Farmers, Farms, Crops,
//                   Livestock, Equipment once seeding logic is added
//   Logs         -> needs Farmers, Farms, Livestock, Equipment
//   Requests     -> wipe-only for now; seeding logic comes later
//
// To add a new model seeder later: create seeders/xxx.seeder.js exporting
// wipeXxx()/seedXxx(context), import it above, and add one entry below in
// the right spot relative to what it depends on.
const SEEDERS = [
    { name: "Associations", wipe: wipeAssociations, seed: seedAssociations },
    { name: "Users", wipe: wipeUsers, seed: seedUsers },
    { name: "Farmers", wipe: wipeFarmers, seed: seedFarmers },
    { name: "Crops", wipe: wipeCrops, seed: seedCrops },
    { name: "Farms", wipe: wipeFarms, seed: seedFarms },
    { name: "Livestock", wipe: wipeLivestocks, seed: seedLivestocks },
    { name: "Equipment", wipe: wipeEquipments, seed: seedEquipments },
    { name: "Reports", wipe: wipeReports, seed: seedReports },
    { name: "Logs", wipe: wipeLogs, seed: seedLogs },
    { name: "Requests", wipe: wipeRequests, seed: seedRequests },
];

async function runSeeders() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not set in your environment/.env file");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB\n");

    console.log("Wiping existing data...");
    for (const seeder of [...SEEDERS].reverse()) {
        console.log(`- ${seeder.name}`);
        await seeder.wipe();
    }
    console.log("");

    console.log("Seeding fresh data...");
    let context = {};
    for (const seeder of SEEDERS) {
        console.log(`--- ${seeder.name} ---`);
        const result = await seeder.seed(context);
        context = { ...context, ...result };
        console.log("");
    }

    console.log("All seeders completed.");
    await mongoose.disconnect();
}

runSeeders()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Seeding failed:", err);
        process.exit(1);
    });