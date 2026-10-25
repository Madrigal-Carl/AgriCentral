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
export const seedLogs = async ({ farmers = [], farms = [], livestocks = [], equipments = [], crops = [], reports = [], requests = [], harvests = [], users = [] } = {}) => {
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
    // Farmer-level distribution notes use the same linked farmer.
    for (const crop of crops) {
        const farmer = farmersById.get(String(crop.assignedFarmer));
        if (!farmer) throw new Error(`seedLogs: crop ${crop.name} is missing its assigned farmer`);

        const associationName = await getAssociationName(crop.association);

        entries.push({
            entityType: "crop",
            entityId: crop._id,
            association: crop.association,
            message: `${crop.quantity} ${crop.name} has been assigned to ${farmer.getFullName()}${associationName ? ` in ${associationName}` : ""
                }.`,
        });
        entries.push({ entityType: "farmer", entityId: farmer._id, association: crop.association, message: `${farmer.getFullName()} received ${crop.quantity} ${crop.name}.` });
    }

    for (const farm of farms) for (const entry of farm.crops) {
        const crop = crops.find((item) => String(item._id) === String(entry.crop));
        if (!crop) throw new Error(`seedLogs: ${farm.tag} references a missing crop`);
        entries.push({ entityType: "crop", entityId: crop._id, association: farm.association, message: `${entry.quantities.planted ?? 0} unit(s) were planted on farm ${farm.tag}.` });
    }
    for (const harvest of harvests) {
        const farm = farms.find((item) => String(item._id) === String(harvest.farm));
        const crop = crops.find((item) => String(item._id) === String(harvest.crop));
        if (!farm || !crop) throw new Error("seedLogs: harvest references a missing farm or crop");
        entries.push({ entityType: "farm", entityId: farm._id, association: farm.association, message: `${harvest.quantity} unit(s) of ${crop.name} were harvested on this farm.`, createdAt: harvest.harvestedAt });
    }
    for (const [entityType, records, stages] of [["report", reports, ["aew", "coordinator"]], ["request", requests, ["coordinator", "governor", "head"]]]) {
        for (const record of records) {
            entries.push({ entityType, entityId: record._id, association: record.association, message: `${entityType === "report" ? "Report" : "Request"} "${record.title}" was submitted.` });
            for (const stage of stages) {
                const decision = record.approvalStatus[stage];
                if (!decision || decision.status === "pending") continue;
                const reviewer = users.find((user) => String(user._id) === String(decision.approvedBy));
                if (!reviewer) throw new Error(`seedLogs: missing ${stage} reviewer for "${record.title}"`);
                entries.push({ entityType, entityId: record._id, association: record.association, message: `${reviewer.fullname} ${decision.status} ${entityType} "${record.title}".`, createdAt: decision.approvedAt });
            }
            if (entityType === "request" && record.releasedIds.length) entries.push({ entityType, entityId: record._id, association: record.association, message: `${record.releasedIds.length} item(s) ${record.releaseStatus === "partial" ? "partially" : "fully"} released for request "${record.title}".` });
        }
    }

    if (!entries.length) {
        console.log("  Nothing to log (no entities provided).");
        return { logs: [] };
    }

    const logs = await Log.insertMany(entries);
    console.log(`  Seeded: ${logs.length} log entr${logs.length === 1 ? "y" : "ies"}.`);

    return { logs };
};
