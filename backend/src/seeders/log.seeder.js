import Log from "../models/log.model.js";

export const wipeLogs = async () => {
    const result = await Log.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} log(s).`);
};

// Requires farmers/farms/livestocks/equipments to already exist so every
// log's `entityId` (and `association`, where applicable) points at a real
// document. Runs last since it depends on everything else.
export const seedLogs = async ({ farmers = [], farms = [], livestocks = [], equipments = [] } = {}) => {
    const entries = [
        ...farmers.map((f) => ({
            entityType: "farmer",
            entityId: f._id,
            association: f.association,
            message: `${f.getFullName()} was registered as a new farmer.`,
        })),
        ...farms.map((f) => ({
            entityType: "farm",
            entityId: f._id,
            association: f.association,
            message: `Farm ${f.tag} was registered.`,
        })),
        ...livestocks.map((l) => ({
            entityType: "livestock",
            entityId: l._id,
            association: l.association,
            message: `${l.animal} (${l.propertyNumber}) has been added to the livestock inventory.`,
        })),
        ...equipments.map((e) => ({
            entityType: "equipment",
            entityId: e._id,
            association: e.association,
            message: `${e.name} (${e.tag}) has been added to the equipment inventory.`,
        })),
    ];

    if (!entries.length) {
        console.log("  Nothing to log (no entities provided).");
        return { logs: [] };
    }

    const logs = await Log.insertMany(entries);
    console.log(`  Seeded: ${logs.length} log entr${logs.length === 1 ? "y" : "ies"}.`);

    return { logs };
};