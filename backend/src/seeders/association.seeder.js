import Association from "../models/association.model.js";

export const wipeAssociations = async () => {
    const result = await Association.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} association(s).`);
};

export const seedAssociations = async ({ maintenance }) => {
    if (!maintenance?.municipalities?.length || (maintenance?.barangays?.length ?? 0) < 10) throw new Error("seedAssociations requires Maintenance with at least 10 active barangays");
    const associations = [];

    for (const barangay of maintenance.barangays.slice(0, 10)) {
        const municipality = maintenance.municipalities.find((item) => String(item._id) === String(barangay.municipality));
        const association = await Association.create({ name: `${barangay.name} Farmers Association`, municipality: municipality._id, barangay: barangay._id });
        associations.push(association);
        console.log(`  Seeded: ${association.name}`);
    }

    return { associations };
};
