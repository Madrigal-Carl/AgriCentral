import Crop from "../models/crop.model.js";

const CROPS_TO_SEED = [
    { name: "Rice", kilo: 1200, status: "planted" },
    { name: "Corn", kilo: 800, status: "not_planted" },
    { name: "Sugarcane", kilo: 500, status: "planted" },
    { name: "Peanut", kilo: 300, status: "not_planted" },
];

export const wipeCrops = async () => {
    const result = await Crop.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} crop(s).`);
};

// Requires associations and farmers to already exist so `association` and
// `assignedFarmer` FKs point at real documents.
export const seedCrops = async ({ farmers } = {}) => {
    if (!farmers?.length) {
        throw new Error("seedCrops requires farmers to already be seeded");
    }

    const crops = [];

    for (let i = 0; i < CROPS_TO_SEED.length; i++) {
        const data = CROPS_TO_SEED[i];
        const farmer = farmers[i % farmers.length];

        const crop = await Crop.create({
            ...data,
            association: farmer.association,
            assignedFarmer: farmer._id,
        });

        crops.push(crop);
        console.log(`  Seeded: ${crop.name} -> ${farmer.getFullName()}`);
    }

    return { crops };
};