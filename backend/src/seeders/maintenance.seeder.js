import { readFile } from "node:fs/promises";
import { maintenanceModels } from "../utils/maintenanceLinks.js";

const EXPECTED_COUNTS = { Boac: 61, Buenavista: 15, Gasan: 25, Mogpog: 37, "Santa Cruz": 55, Torrijos: 25 };
const DEFAULTS = {
    crops: ["Rice", "Corn", "Coconut", "Banana", "Cassava", "Vegetables"],
    equipments: ["Tractor", "Harvester", "Plow", "Sprayer", "Water Pump"],
    colors: ["Black", "White", "Brown", "Gray", "Red", "Black and White", "Spotted"],
};
const ANIMALS = {
    Cattle: ["Brahman", "Holstein Friesian", "Jersey"],
    Carabao: ["Philippine Swamp", "Murrah", "Nili-Ravi"],
    Goat: ["Boer", "Anglo-Nubian", "Saanen"],
    Swine: ["Large White", "Landrace", "Duroc"],
    Chicken: ["Rhode Island Red", "Leghorn", "Plymouth Rock"],
};

export async function loadMaintenanceData() {
    const locations = JSON.parse(await readFile(new URL("./data/marinduque-locations.json", import.meta.url), "utf8"));
    if (locations.municipalities?.length !== 6) throw new Error("Maintenance seed aborted: expected exactly 6 municipalities");
    let total = 0;
    const seen = new Set();
    for (const municipality of locations.municipalities) {
        const expected = EXPECTED_COUNTS[municipality.name];
        if (!expected || seen.has(municipality.name) || municipality.barangays?.length !== expected) {
            throw new Error(`Maintenance seed aborted: ${municipality.name} must contain ${expected ?? "a verified count of"} barangays; found ${municipality.barangays?.length}`);
        }
        if (new Set(municipality.barangays.map((name) => name.trim().toLocaleLowerCase("en"))).size !== expected) throw new Error(`Maintenance seed aborted: duplicate barangays in ${municipality.name}`);
        seen.add(municipality.name);
        total += municipality.barangays.length;
    }
    if (total !== 218) throw new Error(`Maintenance seed aborted: expected 218 barangays; found ${total}`);
    return { locations, defaults: DEFAULTS, animals: ANIMALS };
}

export async function seedMaintenance() {
    const { locations, defaults, animals } = await loadMaintenanceData();
    await Promise.all(Object.values(maintenanceModels).map((Model) => Model.createIndexes()));
    const upsert = (type, name, parent = {}) => maintenanceModels[type].findOneAndUpdate(
        { name: name.trim(), ...parent },
        { $setOnInsert: { name: name.trim(), ...parent, deletedAt: null, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, new: true, sort: { deletedAt: 1, _id: 1 }, timestamps: false, runValidators: true, collation: { locale: "en", strength: 2 } },
    );
    const upsertMany = (type, names, parent = {}, deletedAt = null) => maintenanceModels[type].bulkWrite(names.map((name) => ({ updateOne: {
        filter: { name: name.trim(), ...parent },
        update: { $setOnInsert: { name: name.trim(), ...parent, deletedAt, createdAt: new Date(), updatedAt: new Date() } },
        upsert: true, timestamps: false, collation: { locale: "en", strength: 2 },
    } })), { ordered: false, timestamps: false });
    for (const location of locations.municipalities) {
        const municipality = await upsert("municipalities", location.name);
        await upsertMany("barangays", location.barangays, { municipality: municipality._id }, municipality.deletedAt);
    }
    for (const [type, names] of Object.entries(defaults)) await upsertMany(type, names);
    for (const [name, breeds] of Object.entries(animals)) {
        const animal = await upsert("animals", name);
        await upsertMany("breeds", breeds, { animalType: animal._id }, animal.deletedAt);
    }
    const maintenance = Object.fromEntries(await Promise.all(Object.entries(maintenanceModels).map(async ([type, Model]) => [type, await Model.find({ deletedAt: null }).sort({ name: 1 })])));
    console.log("Maintenance: verified 6 municipalities / 218 barangays; defaults upserted.");
    return { maintenance };
}
