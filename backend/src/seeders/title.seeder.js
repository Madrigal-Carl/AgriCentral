import { maintenanceModels } from "../utils/maintenanceLinks.js";

// Generalized titles offered in the request/report Title dropdowns. The
// request and report seeders pick their titles from these lists.
export const REQUEST_TITLES = {
    equipment: "Equipment Request",
    livestock: "Livestock Request",
    equipmentReplacement: "Equipment Replacement Request",
    livestockRestocking: "Livestock Restocking Request",
    emergency: "Emergency Assistance Request",
    livelihood: "Livelihood Assistance Request",
};

export const REPORT_TITLES = {
    livestockHealth: "Livestock Health Concern",
    livestockDeath: "Livestock Death",
    livestockOffspring: "Livestock Offspring",
    livestockRedispersal: "Livestock Redispersal",
    equipmentMalfunction: "Equipment Malfunction",
    equipmentDamage: "Equipment Damage",
    cropDamage: "Crop Damage",
    pestInfestation: "Pest Infestation",
    farmLand: "Farm Land Concern",
    planting: "Planting Update",
    cropGrowth: "Crop Growth Update",
    harvest: "Harvest Update",
};

// Reference data like the rest of Maintenance: upserted, never wiped, so
// titles admins added or archived survive a reseed.
export async function seedTitles() {
    for (const [type, titles] of [["requestTitles", REQUEST_TITLES], ["reportTitles", REPORT_TITLES]]) {
        const Model = maintenanceModels[type];
        await Model.createIndexes();
        const result = await Model.bulkWrite(Object.values(titles).map((name) => ({ updateOne: {
            filter: { name },
            update: { $setOnInsert: { name, deletedAt: null, createdAt: new Date(), updatedAt: new Date() } },
            upsert: true, timestamps: false, collation: { locale: "en", strength: 2 },
        } })), { ordered: false, timestamps: false });
        console.log(`  ${type}: ${result.upsertedCount} added, ${Object.keys(titles).length - result.upsertedCount} already present.`);
    }
    return {};
}
