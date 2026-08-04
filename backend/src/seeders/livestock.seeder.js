import Livestock from "../models/livestock.model.js";

const LIVESTOCK_TO_SEED = [
    {
        propertyNumber: "LVS-001",
        animal: "Carabao",
        breed: "Native",
        gender: "male",
        birthDate: "2018-03-15",
        color: "Gray",
        weight: 450,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-002",
        animal: "Cattle",
        breed: "Brahman",
        gender: "female",
        birthDate: "2019-06-10",
        color: "Brown",
        weight: 320,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-003",
        animal: "Goat",
        breed: "Boer",
        gender: "female",
        birthDate: "2020-09-01",
        color: "White",
        weight: 45,
        condition: "pregnant",
    },
    {
        propertyNumber: "LVS-004",
        animal: "Native Pig",
        breed: "Landrace",
        gender: "male",
        birthDate: "2021-01-22",
        color: "Pink",
        weight: 80,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-005",
        animal: "Chicken",
        breed: "Native (Free-range)",
        gender: "female",
        birthDate: "2022-02-14",
        color: "Brown",
        weight: 2,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-006",
        animal: "Duck",
        breed: "Itik Pateros",
        gender: "female",
        birthDate: "2021-11-30",
        color: "Brown",
        weight: 1.5,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-007",
        animal: "Carabao",
        breed: "Native",
        gender: "female",
        birthDate: "2017-07-19",
        color: "Gray",
        weight: 430,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-008",
        animal: "Cattle",
        breed: "Native",
        gender: "male",
        birthDate: "2019-04-05",
        color: "Black",
        weight: 300,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-009",
        animal: "Goat",
        breed: "Native",
        gender: "male",
        birthDate: "2020-08-12",
        color: "Brown",
        weight: 40,
        condition: "healthy",
    },
];

// Deliberately has no association/assignedFarmer — these represent
// animals sitting in inventory that a "far" user can pick from when
// creating a request (see request.seeder.js), since real requests
// target existing, unassigned entities.
const UNASSIGNED_LIVESTOCK_TO_SEED = [
    {
        propertyNumber: "LVS-010",
        animal: "Chicken",
        breed: "Broiler",
        gender: "female",
        birthDate: "2023-01-20",
        color: "White",
        weight: 2,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-011",
        animal: "Native Pig",
        breed: "Native",
        gender: "male",
        birthDate: "2022-11-05",
        color: "Black",
        weight: 60,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-012",
        animal: "Duck",
        breed: "Mallard",
        gender: "female",
        birthDate: "2022-06-17",
        color: "Brown",
        weight: 1.8,
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-013",
        animal: "Goat",
        breed: "Native",
        gender: "female",
        birthDate: "2021-10-09",
        color: "White",
        weight: 42,
        condition: "healthy",
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
        console.log(`  Seeded: ${livestock.animal} (${livestock.propertyNumber}) -> ${farmer.getFullName()}`);
    }

    for (const data of UNASSIGNED_LIVESTOCK_TO_SEED) {
        const livestock = await Livestock.create({
            ...data,
            association: null,
            assignedFarmer: null,
            status: "available",
        });

        livestocks.push(livestock);
        console.log(`  Seeded: ${livestock.animal} (${livestock.propertyNumber}) -> unassigned`);
    }

    return { livestocks };
};