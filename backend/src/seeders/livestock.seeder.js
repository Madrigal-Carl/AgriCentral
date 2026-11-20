import Livestock from "../models/livestock.model.js";
import AnimalType from "../models/animalType.model.js";
import Breed from "../models/breed.model.js";
import Color from "../models/color.model.js";

async function linkLivestock(data) {
    const upsert = (Model, filter) => Model.findOneAndUpdate({ ...filter, deletedAt: null }, { $setOnInsert: { ...filter, deletedAt: null } }, { upsert: true, new: true, collation: { locale: "en", strength: 2 } });
    const animal = await upsert(AnimalType, { name: data.animal });
    const breed = await upsert(Breed, { name: data.breed, animalType: animal._id });
    const color = await upsert(Color, { name: data.color });
    return { ...data, animalType: animal._id, breed: breed._id, color: color._id };
}

const LIVESTOCK_TO_SEED = [
    {
        propertyNumber: "LVS-001",
        animal: "Carabao",
        breed: "Native",
        gender: "male",
        birthDate: "2018-03-15",
        dispersedAt: "2019-02-11",
        color: "Gray",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-002",
        animal: "Cattle",
        breed: "Brahman",
        gender: "female",
        birthDate: "2019-06-10",
        dispersedAt: "2020-03-02",
        color: "Brown",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-003",
        animal: "Goat",
        breed: "Boer",
        gender: "female",
        birthDate: "2020-09-01",
        dispersedAt: "2021-05-17",
        color: "White",
        condition: "pregnant",
    },
    {
        propertyNumber: "LVS-004",
        animal: "Native Pig",
        breed: "Landrace",
        gender: "male",
        birthDate: "2021-01-22",
        dispersedAt: "2021-08-09",
        color: "Pink",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-005",
        animal: "Chicken",
        breed: "Native (Free-range)",
        gender: "female",
        birthDate: "2022-02-14",
        dispersedAt: "2022-06-20",
        color: "Brown",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-006",
        animal: "Duck",
        breed: "Itik Pateros",
        gender: "female",
        birthDate: "2021-11-30",
        dispersedAt: "2022-04-04",
        color: "Brown",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-007",
        animal: "Carabao",
        breed: "Native",
        gender: "female",
        birthDate: "2017-07-19",
        dispersedAt: "2018-09-24",
        color: "Gray",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-008",
        animal: "Cattle",
        breed: "Native",
        gender: "male",
        birthDate: "2019-04-05",
        dispersedAt: "2020-01-13",
        color: "Black",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-009",
        animal: "Goat",
        breed: "Native",
        gender: "male",
        birthDate: "2020-08-12",
        dispersedAt: "2021-03-08",
        color: "Brown",
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
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-011",
        animal: "Native Pig",
        breed: "Native",
        gender: "male",
        birthDate: "2022-11-05",
        color: "Black",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-012",
        animal: "Duck",
        breed: "Mallard",
        gender: "female",
        birthDate: "2022-06-17",
        color: "Brown",
        condition: "healthy",
    },
    {
        propertyNumber: "LVS-013",
        animal: "Goat",
        breed: "Native",
        gender: "female",
        birthDate: "2021-10-09",
        color: "White",
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

        if (new Date(data.dispersedAt) <= new Date(data.birthDate)) {
            throw new Error(`seedLivestocks: ${data.propertyNumber} must be dispersed after its birth date`);
        }
        const livestock = await Livestock.create({
            ...await linkLivestock(data),
            association: farmer.association,
            assignedFarmer: farmer._id,
            status: "assigned",
        });

        livestocks.push(livestock);
        console.log(`  Seeded: ${livestock.animal} (${livestock.propertyNumber}) -> ${farmer.getFullName()}`);
    }

    for (const data of UNASSIGNED_LIVESTOCK_TO_SEED) {
        const livestock = await Livestock.create({
            ...await linkLivestock(data),
            association: null,
            assignedFarmer: null,
            status: "available",
            dispersedAt: null,
        });

        livestocks.push(livestock);
        console.log(`  Seeded: ${livestock.animal} (${livestock.propertyNumber}) -> unassigned`);
    }

    return { livestocks };
};
