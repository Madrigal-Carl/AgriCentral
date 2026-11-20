import Equipment from "../models/equipment.model.js";
import EquipmentType from "../models/equipmentType.model.js";

// dispersedAt: when the item was dispersed (released) to its association.
const EQUIPMENT_TO_SEED = [
    { propertyNumber: "EQP-001", name: "Hand Tractor", condition: "good", dispersedAt: "2023-02-14" },
    { propertyNumber: "EQP-002", name: "Water Pump", condition: "excellent", dispersedAt: "2023-06-05" },
    { propertyNumber: "EQP-003", name: "Rice Thresher", condition: "maintenance", dispersedAt: "2022-10-17" },
    { propertyNumber: "EQP-004", name: "Coconut Husker", condition: "good", dispersedAt: "2024-01-22" },
    { propertyNumber: "EQP-005", name: "Cassava Grater", condition: "good", dispersedAt: "2024-04-08" },
    { propertyNumber: "EQP-006", name: "Rice Mill", condition: "excellent", dispersedAt: "2023-09-11" },
    { propertyNumber: "EQP-007", name: "Sprayer", condition: "good", dispersedAt: "2024-07-29" },
    { propertyNumber: "EQP-008", name: "Grass Cutter", condition: "damaged", dispersedAt: "2025-02-03" },
];

// Deliberately has no association/assignedFarmer — these represent
// items sitting in inventory that a "far" user can pick from when
// creating a request (see request.seeder.js), since real requests
// target existing, unassigned entities.
const UNASSIGNED_EQUIPMENT_TO_SEED = [
    { propertyNumber: "EQP-009", name: "Corn Sheller", condition: "good" },
    { propertyNumber: "EQP-010", name: "Weeding Machine", condition: "excellent" },
    { propertyNumber: "EQP-011", name: "Sickle Bar Mower", condition: "good" },
    { propertyNumber: "EQP-012", name: "Multi-Purpose Dryer", condition: "maintenance" },
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
        const equipmentType = await EquipmentType.findOneAndUpdate({ name: data.name, deletedAt: null }, { $setOnInsert: { name: data.name, deletedAt: null } }, { upsert: true, new: true, collation: { locale: "en", strength: 2 } });

        const equipment = await Equipment.create({
            ...data,
            equipmentType: equipmentType._id,
            association: farmer.association,
            assignedFarmer: farmer._id,
            status: "assigned",
        });

        equipments.push(equipment);
        console.log(`  Seeded: ${equipment.name} (${equipment.propertyNumber}) -> ${farmer.getFullName()}`);
    }

    for (const data of UNASSIGNED_EQUIPMENT_TO_SEED) {
        const equipmentType = await EquipmentType.findOneAndUpdate({ name: data.name, deletedAt: null }, { $setOnInsert: { name: data.name, deletedAt: null } }, { upsert: true, new: true, collation: { locale: "en", strength: 2 } });
        const equipment = await Equipment.create({
            ...data,
            equipmentType: equipmentType._id,
            association: null,
            assignedFarmer: null,
            status: "available",
            dispersedAt: null,
        });

        equipments.push(equipment);
        console.log(`  Seeded: ${equipment.name} (${equipment.propertyNumber}) -> unassigned`);
    }

    return { equipments };
};
