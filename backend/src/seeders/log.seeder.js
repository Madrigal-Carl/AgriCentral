import Log from "../models/log.model.js";
import Association from "../models/association.model.js";

export const wipeLogs = async () => {
    const result = await Log.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} log(s).`);
};

// Same lookup createCrop() uses to fold the association's name into the
// log message ("...in Sample Association.") when one is present.
const getAssociationName = async (associationId) => {
    if (!associationId) return null;
    const association = await Association.findById(associationId).select("name");
    return association?.name ?? null;
};

// Requires farmers/farms/livestocks/equipments/crops to already exist so
// every log's `entityId` (and `association`, where applicable) points at a
// real document. Runs last since it depends on everything else.
export const seedLogs = async ({ farmers = [], farms = [], livestocks = [], equipments = [], crops = [] } = {}) => {
    // crop.assignedFarmer isn't populated by crop.seeder.js, so build a
    // lookup to resolve each crop's owning farmer for the message text.
    const farmersById = new Map(farmers.map((f) => [String(f._id), f]));

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
            message: `${e.name} (${e.propertyNumber}) has been added to the equipment inventory.`,
        })),
    ];

    // Crops mirror only the crop-level createLog() call from createCrop() —
    // no farmer-level note, since seeded crops aren't distributed yet.
    for (const crop of crops) {
        const farmer = farmersById.get(String(crop.assignedFarmer));
        if (!farmer) continue;

        const associationName = await getAssociationName(crop.association);

        entries.push({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association,
            message: `${crop.name} (${crop.kilo} kg) has been assigned to ${farmer.getFullName()}${associationName ? ` in ${associationName}` : ""
                }.`,
        });
    }

    if (!entries.length) {
        console.log("  Nothing to log (no entities provided).");
        return { logs: [] };
    }

    const logs = await Log.insertMany(entries);
    console.log(`  Seeded: ${logs.length} log entr${logs.length === 1 ? "y" : "ies"}.`);

    return { logs };
};