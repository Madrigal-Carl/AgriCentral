import Farm from "../models/farm.model.js";

// Each farm now also lists who works it (`farmerAssignments`, indices into
// the seeded `farmers` array) and what's growing on it
// (`cropAssignments`, indices into the seeded `crops` array + a per-farm
// quantity breakdown). Barangays are matched to the same farmers/
// associations used in farmer.seeder.js so a farm's assigned farmers
// actually live nearby.
const FARMS_TO_SEED = [
    {
        address: "Sitio Malabaybay, Brgy. Agot, Boac, Marinduque",
        size: 2.5,
        latitude: 13.4762,
        longitude: 121.8563,
        associationIndex: 0,
        farmerAssignments: [{ farmerIndex: 0, classification: "owner" }],
        cropAssignments: [
            {
                // Rice
                cropIndex: 0,
                quantities: { planted: 1000, growing: 100, harvested: 850, withered: 30, damaged: 20 },
            },
        ],
    },
    {
        address: "Sitio Kanluran, Brgy. Isok I, Boac, Marinduque",
        size: 1.8,
        latitude: 13.4468,
        longitude: 121.8432,
        associationIndex: 1,
        farmerAssignments: [{ farmerIndex: 1, classification: "owner" }],
        cropAssignments: [
            {
                // Coconut
                cropIndex: 1,
                quantities: { planted: 1500, growing: 300, harvested: 1100, withered: 50, damaged: 50 },
            },
        ],
    },
    {
        address: "Sitio Dulong Bayan, Brgy. Laylay, Boac, Marinduque",
        size: 3.2,
        latitude: 13.4395,
        longitude: 121.8328,
        associationIndex: 2,
        farmerAssignments: [
            { farmerIndex: 2, classification: "owner" },
            { farmerIndex: 12, classification: "tenant" },
        ],
        cropAssignments: [
            {
                // Banana (Saba)
                cropIndex: 2,
                quantities: { planted: 700, growing: 150, harvested: 500, withered: 30, damaged: 20 },
            },
        ],
    },
    {
        address: "Sitio Ibaba, Brgy. Mansiwat, Boac, Marinduque",
        size: 2.0,
        latitude: 13.4614,
        longitude: 121.8598,
        associationIndex: 3,
        farmerAssignments: [
            { farmerIndex: 3, classification: "owner" },
            { farmerIndex: 13, classification: "caretaker" },
        ],
        cropAssignments: [
            {
                // Cassava
                cropIndex: 3,
                quantities: { planted: 550, growing: 80, harvested: 420, withered: 30, damaged: 20 },
            },
        ],
    },
    {
        address: "Sitio Look, Brgy. Tumagabok, Boac, Marinduque",
        size: 4.1,
        latitude: 13.4203,
        longitude: 121.8215,
        associationIndex: 4,
        farmerAssignments: [{ farmerIndex: 4, classification: "owner" }],
        cropAssignments: [
            {
                // Sweet Potato (Kamote)
                cropIndex: 4,
                quantities: { planted: 480, growing: 60, harvested: 380, withered: 25, damaged: 15 },
            },
        ],
    },
    {
        address: "Sitio Wawa, Brgy. Balimbing, Boac, Marinduque",
        size: 1.5,
        latitude: 13.4857,
        longitude: 121.8712,
        associationIndex: 5,
        farmerAssignments: [{ farmerIndex: 5, classification: "owner" }],
        cropAssignments: [
            {
                // Corn
                cropIndex: 5,
                quantities: { planted: 650, growing: 100, harvested: 500, withered: 30, damaged: 20 },
            },
        ],
    },
    {
        address: "Sitio Pulo, Brgy. Boi, Boac, Marinduque",
        size: 2.9,
        latitude: 13.4108,
        longitude: 121.8022,
        associationIndex: 6,
        farmerAssignments: [{ farmerIndex: 6, classification: "owner" }],
        cropAssignments: [
            {
                // Calamansi
                cropIndex: 6,
                quantities: { planted: 320, growing: 60, harvested: 240, withered: 12, damaged: 8 },
            },
        ],
    },
    {
        address: "Sitio Kanto, Brgy. Catubugan, Boac, Marinduque",
        size: 2.2,
        latitude: 13.4963,
        longitude: 121.8317,
        associationIndex: 7,
        farmerAssignments: [{ farmerIndex: 7, classification: "owner" }],
        cropAssignments: [
            {
                // Gabi (Taro)
                cropIndex: 7,
                quantities: { planted: 280, growing: 50, harvested: 210, withered: 12, damaged: 8 },
            },
        ],
    },
    {
        address: "Sitio Baybayin, Brgy. Poctoy, Boac, Marinduque",
        size: 1.9,
        latitude: 13.5012,
        longitude: 121.8895,
        associationIndex: 8,
        farmerAssignments: [{ farmerIndex: 8, classification: "owner" }],
        cropAssignments: [
            {
                // Mango
                cropIndex: 8,
                quantities: { planted: 240, growing: 40, harvested: 180, withered: 12, damaged: 8 },
            },
        ],
    },
    {
        address: "Sitio Bundok, Brgy. Mataas na Bayan, Boac, Marinduque",
        size: 3.6,
        latitude: 13.4550,
        longitude: 121.8180,
        associationIndex: 9,
        farmerAssignments: [{ farmerIndex: 9, classification: "owner" }],
        cropAssignments: [
            {
                // Peanut
                cropIndex: 9,
                quantities: { planted: 200, growing: 30, harvested: 150, withered: 12, damaged: 8 },
            },
        ],
    },
    {
        address: "Sitio Ilaya, Brgy. Tabi, Boac, Marinduque",
        size: 2.3,
        latitude: 13.4300,
        longitude: 121.8600,
        associationIndex: 0,
        farmerAssignments: [{ farmerIndex: 10, classification: "owner" }],
        cropAssignments: [
            {
                // Squash (Kalabasa)
                cropIndex: 10,
                quantities: { planted: 400, growing: 50, harvested: 320, withered: 20, damaged: 10 },
            },
        ],
    },
    {
        address: "Sitio Bagumbayan, Brgy. Daig, Boac, Marinduque",
        size: 1.7,
        latitude: 13.4680,
        longitude: 121.8500,
        associationIndex: 1,
        farmerAssignments: [{ farmerIndex: 11, classification: "owner" }],
        cropAssignments: [
            {
                // Eggplant (Talong)
                cropIndex: 11,
                quantities: { planted: 350, growing: 60, harvested: 260, withered: 20, damaged: 10 },
            },
        ],
    },
];

export const wipeFarms = async () => {
    const result = await Farm.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} farm(s).`);
};

// Requires associations, farmers, and crops to already be seeded — every
// farm now comes with its assignedFarmers and crops (with per-farm
// quantities) already populated, since Harvest records depend on farms
// actually having crops to harvest from.
export const seedFarms = async ({ associations, farmers, crops } = {}) => {
    if (!associations?.length) {
        throw new Error("seedFarms requires associations to already be seeded");
    }
    if (!farmers?.length) {
        throw new Error("seedFarms requires farmers to already be seeded");
    }
    if (!crops?.length) {
        throw new Error("seedFarms requires crops to already be seeded");
    }

    const farms = [];

    for (const data of FARMS_TO_SEED) {
        const association = associations[data.associationIndex];

        const assignedFarmers = data.farmerAssignments.map(({ farmerIndex, classification }) => ({
            farmer: farmers[farmerIndex]._id,
            classification,
        }));

        const farmCrops = data.cropAssignments.map(({ cropIndex, quantities }) => ({
            crop: crops[cropIndex]._id,
            quantities,
        }));

        const farm = await Farm.create({
            association: association._id,
            address: data.address,
            size: data.size,
            latitude: data.latitude,
            longitude: data.longitude,
            assignedFarmers,
            crops: farmCrops,
        });

        farms.push(farm);

        const farmerNames = data.farmerAssignments
            .map(({ farmerIndex }) => farmers[farmerIndex].getFullName())
            .join(", ");
        console.log(`  Seeded: ${farm.tag} -> ${association.name} (${farmerNames})`);
    }

    return { farms };
};