import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import { stageQuantityTotal } from "../utils/cropStages.js";

// Each farm now also lists who works it (`farmerAssignments`, indices into
// the seeded `farmers` array) and what's planted on it
// (`cropAssignments`, indices into the seeded `crops` array + a per-farm
// stage breakdown; newly planted = planted minus the five stages). Barangays are matched to the same farmers/
// associations used in farmer.seeder.js so a farm's assigned farmers
// actually live nearby.
const FARMS_TO_SEED = [
    {
        size: 2.5,
        latitude: 13.4762,
        longitude: 121.8563,
        associationIndex: 0,
        farmerAssignments: [{ farmerIndex: 0, classification: "owner" }],
        cropAssignments: [
            {
                // Rice
                cropIndex: 0,
                quantities: { planted: 1000, flowering: 30, reproductive: 20, vegetative: 50, harvested: 850, damaged: 20 },
            },
        ],
    },
    {
        size: 1.8,
        latitude: 13.4468,
        longitude: 121.8432,
        associationIndex: 1,
        farmerAssignments: [{ farmerIndex: 1, classification: "owner" }],
        cropAssignments: [
            {
                // Coconut
                cropIndex: 1,
                quantities: { planted: 1500, flowering: 90, reproductive: 60, vegetative: 150, harvested: 1100, damaged: 50 },
            },
        ],
    },
    {
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
                quantities: { planted: 700, flowering: 45, reproductive: 30, vegetative: 75, harvested: 500, damaged: 20 },
            },
        ],
    },
    {
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
                quantities: { planted: 550, flowering: 24, reproductive: 16, vegetative: 40, harvested: 420, damaged: 20 },
            },
        ],
    },
    {
        size: 4.1,
        latitude: 13.4203,
        longitude: 121.8215,
        associationIndex: 4,
        farmerAssignments: [{ farmerIndex: 4, classification: "owner" }],
        cropAssignments: [
            {
                // Sweet Potato (Kamote)
                cropIndex: 4,
                quantities: { planted: 480, flowering: 18, reproductive: 12, vegetative: 30, harvested: 380, damaged: 15 },
            },
        ],
    },
    {
        size: 1.5,
        latitude: 13.4857,
        longitude: 121.8712,
        associationIndex: 5,
        farmerAssignments: [{ farmerIndex: 5, classification: "owner" }],
        cropAssignments: [
            {
                // Corn
                cropIndex: 5,
                quantities: { planted: 650, flowering: 30, reproductive: 20, vegetative: 50, harvested: 500, damaged: 20 },
            },
        ],
    },
    {
        size: 2.9,
        latitude: 13.4108,
        longitude: 121.8022,
        associationIndex: 6,
        farmerAssignments: [{ farmerIndex: 6, classification: "owner" }],
        cropAssignments: [
            {
                // Calamansi
                cropIndex: 6,
                quantities: { planted: 320, flowering: 18, reproductive: 12, vegetative: 30, harvested: 240, damaged: 8 },
            },
        ],
    },
    {
        size: 2.2,
        latitude: 13.4963,
        longitude: 121.8317,
        associationIndex: 7,
        farmerAssignments: [{ farmerIndex: 7, classification: "owner" }],
        cropAssignments: [
            {
                // Gabi (Taro)
                cropIndex: 7,
                quantities: { planted: 280, flowering: 15, reproductive: 10, vegetative: 25, harvested: 210, damaged: 8 },
            },
        ],
    },
    {
        size: 1.9,
        latitude: 13.5012,
        longitude: 121.8895,
        associationIndex: 8,
        farmerAssignments: [{ farmerIndex: 8, classification: "owner" }],
        cropAssignments: [
            {
                // Mango
                cropIndex: 8,
                quantities: { planted: 240, flowering: 12, reproductive: 8, vegetative: 20, harvested: 180, damaged: 8 },
            },
        ],
    },
    {
        size: 3.6,
        latitude: 13.4550,
        longitude: 121.8180,
        associationIndex: 9,
        farmerAssignments: [{ farmerIndex: 9, classification: "owner" }],
        cropAssignments: [
            {
                // Peanut
                cropIndex: 9,
                quantities: { planted: 200, flowering: 9, reproductive: 6, vegetative: 15, harvested: 150, damaged: 8 },
            },
        ],
    },
    {
        size: 2.3,
        latitude: 13.4300,
        longitude: 121.8600,
        associationIndex: 0,
        farmerAssignments: [{ farmerIndex: 10, classification: "owner" }],
        cropAssignments: [
            {
                // Squash (Kalabasa)
                cropIndex: 10,
                quantities: { planted: 400, flowering: 15, reproductive: 10, vegetative: 25, harvested: 320, damaged: 10 },
            },
        ],
    },
    {
        size: 1.7,
        latitude: 13.4680,
        longitude: 121.8500,
        associationIndex: 1,
        farmerAssignments: [{ farmerIndex: 11, classification: "owner" }],
        cropAssignments: [
            {
                // Eggplant (Talong)
                cropIndex: 11,
                quantities: { planted: 350, flowering: 18, reproductive: 12, vegetative: 30, harvested: 260, damaged: 10 },
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
export const seedFarms = async ({ associations, farmers, crops, maintenance } = {}) => {
    if (!maintenance?.municipalities?.length || !maintenance?.barangays?.length) throw new Error("seedFarms requires Maintenance to already be seeded");
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
        if (!association) throw new Error(`seedFarms: missing association ${data.associationIndex}`);
        const municipality = maintenance.municipalities.find((item) => String(item._id) === String(association.municipality));
        const barangay = maintenance.barangays.find((item) => String(item._id) === String(association.barangay));
        if (!municipality || !barangay || String(barangay.municipality) !== String(municipality._id)) {
            throw new Error(`seedFarms: invalid location for ${association.name}`);
        }

        const assignedFarmers = data.farmerAssignments.map(({ farmerIndex, classification }) => {
            const farmer = farmers[farmerIndex];
            if (!farmer || String(farmer.association) !== String(association._id)) throw new Error(`seedFarms: farmer ${farmerIndex} must belong to ${association.name}`);
            return { farmer: farmer._id, classification };
        });

        const farmCrops = data.cropAssignments.map(({ cropIndex, quantities }) => {
            const crop = crops[cropIndex];
            if (!crop || String(crop.association) !== String(association._id) || !assignedFarmers.some((entry) => String(entry.farmer) === String(crop.assignedFarmer))) {
                throw new Error(`seedFarms: crop ${cropIndex} must belong to an assigned farmer in ${association.name}`);
            }
            if (quantities.planted > crop.unplanted) throw new Error(`seedFarms: insufficient unplanted stock for ${crop.name}`);
            if (stageQuantityTotal(quantities) > quantities.planted) throw new Error(`seedFarms: stage quantities for ${crop.name} exceed planted`);
            return { crop: crop._id, quantities };
        });

        const farm = await Farm.create({
            association: association._id,
            municipality: municipality._id,
            barangay: barangay._id,
            street: "",
            address: `${barangay.name}, ${municipality.name}`,
            size: data.size,
            latitude: data.latitude,
            longitude: data.longitude,
            assignedFarmers,
            crops: farmCrops,
        });

        farms.push(farm);
        for (const entry of farmCrops) {
            const crop = crops.find((item) => String(item._id) === String(entry.crop));
            crop.unplanted -= entry.quantities.planted ?? 0;
            await Crop.updateOne({ _id: crop._id }, { $set: { unplanted: crop.unplanted } });
        }

        const farmerNames = data.farmerAssignments
            .map(({ farmerIndex }) => farmers[farmerIndex].getFullName())
            .join(", ");
        console.log(`  Seeded: ${farm.tag} -> ${association.name} (${farmerNames})`);
    }

    return { farms };
};
