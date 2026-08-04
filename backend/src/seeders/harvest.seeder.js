import Harvest from "../models/harvest.model.js";

// Each entry references a farm and crop by index into the seeded `farms`
// / `crops` arrays. The `quantity` values for a given farm+crop pair sum
// up to that farm's embedded `crops[].quantities.harvested` figure (see
// farm.seeder.js), split across one or two harvest events the way a real
// crop cycle (e.g. two harvest passes for rice, or coconut collected
// quarterly) would be recorded over time.
const HARVESTS_TO_SEED = [
    // Farm 0 - Agot (Rice), harvested total: 850
    { farmIndex: 0, cropIndex: 0, quantity: 500, harvestedAt: "2025-05-20" },
    { farmIndex: 0, cropIndex: 0, quantity: 350, harvestedAt: "2025-10-15" },

    // Farm 1 - Isok I (Coconut), harvested total: 1100
    { farmIndex: 1, cropIndex: 1, quantity: 600, harvestedAt: "2025-03-10" },
    { farmIndex: 1, cropIndex: 1, quantity: 500, harvestedAt: "2025-09-12" },

    // Farm 2 - Laylay (Banana), harvested total: 500
    { farmIndex: 2, cropIndex: 2, quantity: 300, harvestedAt: "2025-04-18" },
    { farmIndex: 2, cropIndex: 2, quantity: 200, harvestedAt: "2025-08-22" },

    // Farm 3 - Mansiwat (Cassava), harvested total: 420
    { farmIndex: 3, cropIndex: 3, quantity: 420, harvestedAt: "2025-05-30" },

    // Farm 4 - Tumagabok (Sweet Potato), harvested total: 380
    { farmIndex: 4, cropIndex: 4, quantity: 380, harvestedAt: "2025-06-18" },

    // Farm 5 - Balimbing (Corn), harvested total: 500
    { farmIndex: 5, cropIndex: 5, quantity: 500, harvestedAt: "2025-07-25" },

    // Farm 6 - Boi (Calamansi), harvested total: 240
    { farmIndex: 6, cropIndex: 6, quantity: 240, harvestedAt: "2025-08-10" },

    // Farm 7 - Catubugan (Gabi), harvested total: 210
    { farmIndex: 7, cropIndex: 7, quantity: 210, harvestedAt: "2025-09-02" },

    // Farm 8 - Poctoy (Mango), harvested total: 180
    { farmIndex: 8, cropIndex: 8, quantity: 180, harvestedAt: "2025-04-05" },

    // Farm 9 - Mataas na Bayan (Peanut), harvested total: 150
    { farmIndex: 9, cropIndex: 9, quantity: 150, harvestedAt: "2025-06-28" },

    // Farm 10 - Tabi (Squash), harvested total: 320
    { farmIndex: 10, cropIndex: 10, quantity: 320, harvestedAt: "2025-06-05" },

    // Farm 11 - Daig (Eggplant), harvested total: 260
    { farmIndex: 11, cropIndex: 11, quantity: 260, harvestedAt: "2025-07-01" },
];

export const wipeHarvests = async () => {
    const result = await Harvest.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} harvest record(s).`);
};

// Requires farms (with crops already embedded, see farm.seeder.js) and
// crops to already be seeded, so `farm` and `crop` FKs point at real
// documents.
export const seedHarvests = async ({ farms, crops } = {}) => {
    if (!farms?.length) {
        throw new Error("seedHarvests requires farms to already be seeded");
    }
    if (!crops?.length) {
        throw new Error("seedHarvests requires crops to already be seeded");
    }

    const harvests = [];

    for (const data of HARVESTS_TO_SEED) {
        const farm = farms[data.farmIndex];
        const crop = crops[data.cropIndex];

        const harvest = await Harvest.create({
            farm: farm._id,
            association: farm.association,
            crop: crop._id,
            quantity: data.quantity,
            harvestedAt: data.harvestedAt,
        });

        harvests.push(harvest);
        console.log(`  Seeded: ${data.quantity} ${crop.name} harvested from ${farm.tag} on ${data.harvestedAt}`);
    }

    return { harvests };
};