import Crop from "../models/crop.model.js";

const CROPS_TO_SEED = [
    { name: "Rice", quantity: 1200 },
    { name: "Corn", quantity: 800 },
    { name: "Sugarcane", quantity: 500 },
    { name: "Peanut", quantity: 300 },
];

export const wipeCrops = async () => {
    const result = await Crop.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} crop(s).`);
};

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
            unplanted: data.quantity,
            isDistributed: true,
            association: farmer.association,
            assignedFarmer: farmer._id,
        });

        crops.push(crop);
        console.log(`  Seeded: ${crop.name} -> ${farmer.getFullName()}`);
    }

    return { crops };
};