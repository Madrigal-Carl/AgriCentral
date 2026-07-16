import Farm from "../models/farm.model.js";

const FARMS_TO_SEED = [
    {
        address: "Sitio Malinis, Brgy. San Isidro, Nueva Ecija",
        size: 3.5,
        latitude: 15.5784,
        longitude: 120.9814,
        associationIndex: 0,
    },
    {
        address: "Sitio Bagong Buhay, Brgy. Mabuhay, Bulacan",
        size: 2.75,
        latitude: 14.7943,
        longitude: 120.8794,
        associationIndex: 1,
    },
];

export const wipeFarms = async () => {
    const result = await Farm.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} farm(s).`);
};

// Only requires associations now — farms are seeded unassigned (no
// farmers, no crops), matching how a real farm starts out before
// anyone/anything is attached to it.
export const seedFarms = async ({ associations } = {}) => {
    if (!associations?.length) {
        throw new Error("seedFarms requires associations to already be seeded");
    }

    const farms = [];

    for (const data of FARMS_TO_SEED) {
        const association = associations[data.associationIndex];

        const farm = await Farm.create({
            association: association._id,
            address: data.address,
            size: data.size,
            latitude: data.latitude,
            longitude: data.longitude,
        });

        farms.push(farm);
        console.log(`  Seeded: ${farm.tag} -> ${association.name}`);
    }

    return { farms };
};