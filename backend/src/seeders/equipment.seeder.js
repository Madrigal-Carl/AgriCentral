import Equipment from "../models/equipment.model.js";

const EQUIPMENT_TO_SEED = [
    { propertyNumber: "EQP-001", name: "Hand Tractor", condition: "good" },
    { propertyNumber: "EQP-002", name: "Water Pump", condition: "excellent" },
    { propertyNumber: "EQP-003", name: "Rice Thresher", condition: "maintenance" },
];

// Deliberately has no association/assignedFarmer — these represent
// items sitting in inventory that a "far" user can pick from when
// creating a request (see request.seeder.js), since real requests
// target existing, unassigned entities.
const UNASSIGNED_EQUIPMENT_TO_SEED = [
    { propertyNumber: "EQP-004", name: "Corn Sheller", condition: "good" },
    { propertyNumber: "EQP-005", name: "Sprayer", condition: "excellent" },
];

export const wipeEquipments = async () => {
    const result = await Equipment.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} equipment record(s).`);
};

// Requires farmers to already exist so `association` and `assignedFarmer`
// FKs point at real documents.
export const seedEquipments = async ({ farmers } = {}) => {
    if (!farmers?.length) {
        throw new Error("seedEquipments requires farmers to already be seeded");
    }

    const equipments = [];

    for (let i = 0; i < EQUIPMENT_TO_SEED.length; i++) {
        const data = EQUIPMENT_TO_SEED[i];
        const farmer = farmers[i % farmers.length];

        const equipment = await Equipment.create({
            ...data,
            association: farmer.association,
            assignedFarmer: farmer._id,
            status: "assigned",
        });

        equipments.push(equipment);
        console.log(`  Seeded: ${equipment.name} (${equipment.propertyNumber}) -> ${farmer.getFullName()}`);
    }

    for (const data of UNASSIGNED_EQUIPMENT_TO_SEED) {
        const equipment = await Equipment.create({
            ...data,
            association: null,
            assignedFarmer: null,
            status: "available",
        });

        equipments.push(equipment);
        console.log(`  Seeded: ${equipment.name} (${equipment.propertyNumber}) -> unassigned`);
    }

    return { equipments };
};