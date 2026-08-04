import Association from "../models/association.model.js";

const ASSOCIATIONS_TO_SEED = [
    { name: "Agot Rice Farmers Association" },
    { name: "Isok Vegetable Growers Cooperative" },
    { name: "Laylay Coconut Farmers Association" },
    { name: "Mansiwat Agri-Livestock Association" },
    { name: "Tumagabok Rootcrop Growers Cooperative" },
    { name: "Balimbing Farmers and Fisherfolk Association" },
    { name: "Boi Corn Producers Association" },
    { name: "Catubugan Banana Growers Cooperative" },
    { name: "Poctoy Coastal Farmers Association" },
    { name: "Mataas na Bayan Highland Farmers Association" },
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