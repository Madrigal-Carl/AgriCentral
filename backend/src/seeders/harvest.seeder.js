import Harvest from "../models/harvest.model.js";

// Each entry references a farm and crop by index into the seeded `farms`
// / `crops` arrays. The `quantity` values for a given farm+crop pair sum
// up to that farm's embedded `crops[].quantities.harvested` figure (see
// farm.seeder.js), split across one or two harvest events the way a real
// crop cycle (e.g. two harvest passes for rice, or coconut collected
// quarterly) would be recorded over time.
const HARVESTS_TO_SEED = [
    // Farm 0, harvested total: 850
    { farmIndex: 0, cropIndex: 0, quantity: 500, harvestedAt: "2025-05-20" },
    { farmIndex: 0, cropIndex: 0, quantity: 350, harvestedAt: "2025-10-15" },

    // Farm 1, harvested total: 1100
    { farmIndex: 1, cropIndex: 1, quantity: 600, harvestedAt: "2025-03-10" },
    { farmIndex: 1, cropIndex: 1, quantity: 500, harvestedAt: "2025-09-12" },

    // Farm 2, harvested total: 500
    { farmIndex: 2, cropIndex: 2, quantity: 300, harvestedAt: "2025-04-18" },
    { farmIndex: 2, cropIndex: 2, quantity: 200, harvestedAt: "2025-08-22" },

    // Farm 3, harvested total: 420
    { farmIndex: 3, cropIndex: 3, quantity: 420, harvestedAt: "2025-05-30" },

    // Farm 4, harvested total: 380
    { farmIndex: 4, cropIndex: 4, quantity: 380, harvestedAt: "2025-06-18" },

    // Farm 5, harvested total: 500
    { farmIndex: 5, cropIndex: 5, quantity: 500, harvestedAt: "2025-07-25" },

    // Farm 6, harvested total: 240
    { farmIndex: 6, cropIndex: 6, quantity: 240, harvestedAt: "2025-08-10" },

    // Farm 7, harvested total: 210
    { farmIndex: 7, cropIndex: 7, quantity: 210, harvestedAt: "2025-09-02" },

    // Farm 8, harvested total: 180
    { farmIndex: 8, cropIndex: 8, quantity: 180, harvestedAt: "2025-04-05" },

    // Farm 9, harvested total: 150
    { farmIndex: 9, cropIndex: 9, quantity: 150, harvestedAt: "2025-06-28" },

    // Farm 10, harvested total: 320
    { farmIndex: 10, cropIndex: 10, quantity: 320, harvestedAt: "2025-06-05" },

    // Farm 11, harvested total: 260
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
    const totals = new Map();
    for (const data of HARVESTS_TO_SEED) {
        const farm = farms[data.farmIndex];
        const crop = crops[data.cropIndex];
        const entry = farm?.crops?.find((item) => String(item.crop) === String(crop?._id));
        if (!entry || String(farm.association) !== String(crop.association)) throw new Error(`seedHarvests: crop ${data.cropIndex} must be planted in farm ${data.farmIndex} in the same association`);
        const key = `${farm._id}:${crop._id}`;
        totals.set(key, (totals.get(key) ?? 0) + data.quantity);
    }
    for (const farm of farms) for (const entry of farm.crops) {
        if ((totals.get(`${farm._id}:${entry.crop}`) ?? 0) !== (entry.quantities.harvested ?? 0)) throw new Error(`seedHarvests: harvest totals do not match ${farm.tag}`);
    }

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
