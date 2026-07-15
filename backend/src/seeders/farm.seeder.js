import Farm from "../models/farm.model.js";

const FARMS_TO_SEED = [
    {
        tag: "FARM-001",
        address: "Sitio Malinis, Brgy. San Isidro, Nueva Ecija",
        latitude: 15.5784,
        longitude: 120.9814,
        associationIndex: 0,
        farmerIndexes: [0, 1],
        cropIndexes: [0, 1],
    },
    {
        tag: "FARM-002",
        address: "Sitio Bagong Buhay, Brgy. Mabuhay, Bulacan",
        latitude: 14.7943,
        longitude: 120.8794,
        associationIndex: 1,
        farmerIndexes: [2, 3],
        cropIndexes: [2, 3],
    },
];

export const wipeFarms = async () => {
    const result = await Farm.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} farm(s).`);
};

// Requires associations, farmers, and crops to already exist so
// `association`, `assignedFarmers`, and `crops.crop` FKs all resolve.
export const seedFarms = async ({ associations, farmers, crops } = {}) => {
    if (!associations?.length || !farmers?.length || !crops?.length) {
        throw new Error("seedFarms requires associations, farmers, and crops to already be seeded");
    }

    const farms = [];

    for (const data of FARMS_TO_SEED) {
        const association = associations[data.associationIndex];
        const assignedFarmers = data.farmerIndexes.map((i) => farmers[i]._id);
        const farmCrops = data.cropIndexes.map((i) => ({
            crop: crops[i]._id,
            status: "planted",
            yield: 0,
        }));

        const farm = await Farm.create({
            association: association._id,
            tag: data.tag,
            address: data.address,
            assignedFarmers,
            crops: farmCrops,
            latitude: data.latitude,
            longitude: data.longitude,
        });

        farms.push(farm);
        console.log(`  Seeded: ${farm.tag} -> ${association.name}`);
    }

    return { farms };
};