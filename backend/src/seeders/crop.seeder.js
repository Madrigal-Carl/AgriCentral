import Crop from "../models/crop.model.js";

const CROPS_TO_SEED = [
    { name: "Rice", quantity: 1500 },
    { name: "Coconut", quantity: 2000 },
    { name: "Banana (Saba)", quantity: 900 },
    { name: "Cassava", quantity: 700 },
    { name: "Sweet Potato (Kamote)", quantity: 600 },
    { name: "Corn", quantity: 850 },
    { name: "Calamansi", quantity: 400 },
    { name: "Gabi (Taro)", quantity: 350 },
    { name: "Mango", quantity: 300 },
    { name: "Peanut", quantity: 250 },
    { name: "Squash (Kalabasa)", quantity: 500 },
    { name: "Eggplant (Talong)", quantity: 450 },
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