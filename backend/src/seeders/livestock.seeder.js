import Livestock from "../models/livestock.model.js";

const LIVESTOCK_TO_SEED = [
    {
        tag: "LVS-001",
        animal: "Carabao",
        breed: "Native",
        gender: "male",
        birthDate: "2019-03-15",
        color: "Gray",
        weight: 450,
        condition: "healthy",
    },
    {
        tag: "LVS-002",
        animal: "Cattle",
        breed: "Brahman",
        gender: "female",
        birthDate: "2020-06-10",
        color: "Brown",
        weight: 320,
        condition: "healthy",
    },
    {
        tag: "LVS-003",
        animal: "Goat",
        breed: "Boer",
        gender: "female",
        birthDate: "2021-09-01",
        color: "White",
        weight: 45,
        condition: "pregnant",
    },
];

export const wipeLivestocks = async () => {
    const result = await Livestock.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} livestock record(s).`);
};

// Requires farmers to already exist so `association` and `assignedFarmer`
// FKs point at real documents.
export const seedLivestocks = async ({ farmers } = {}) => {
    if (!farmers?.length) {
        throw new Error("seedLivestocks requires farmers to already be seeded");
    }

    const livestocks = [];

    for (let i = 0; i < LIVESTOCK_TO_SEED.length; i++) {
        const data = LIVESTOCK_TO_SEED[i];
        const farmer = farmers[i % farmers.length];

        const livestock = await Livestock.create({
            ...data,
            association: farmer.association,
            assignedFarmer: farmer._id,
            status: "assigned",
        });

        livestocks.push(livestock);
        console.log(`  Seeded: ${livestock.animal} (${livestock.tag}) -> ${farmer.getFullName()}`);
    }

    return { livestocks };
};