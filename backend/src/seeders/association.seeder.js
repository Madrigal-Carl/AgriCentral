import Association from "../models/association.model.js";

const ASSOCIATIONS_TO_SEED = [
    { name: "San Isidro Farmers Association" },
    { name: "Mabuhay Agri Cooperative" },
];

export const wipeAssociations = async () => {
    const result = await Association.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} association(s).`);
};

export const seedAssociations = async () => {
    const associations = [];

    for (const data of ASSOCIATIONS_TO_SEED) {
        const association = await Association.create(data);
        associations.push(association);
        console.log(`  Seeded: ${association.name}`);
    }

    return { associations };
};