import Association from "../models/association.model.js";
import Farm from "../models/farm.model.js";
import Farmer from "../models/farmer.model.js";
import Crop from "../models/crop.model.js";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Request from "../models/request.model.js";
import { maintenanceModels, validateLink, idOf, referenceError } from "../utils/maintenanceLinks.js";
import { createLog } from "./log.service.js";

const parents = { barangays: ["municipality", "municipalities"], breeds: ["animalType", "animals"] };
const references = {
    municipalities: [[Association, "municipality"], [Farm, "municipality"], [Farmer, "municipality"], [maintenanceModels.barangays, "municipality"]],
    barangays: [[Association, "barangay"], [Farm, "barangay"], [Farmer, "barangay"]],
    crops: [[Crop, "cropType"]], equipments: [[Equipment, "equipmentType"], [Request, "lines.key"]],
    animals: [[Livestock, "animalType"], [maintenanceModels.breeds, "animalType"], [Request, "lines.key"]],
    breeds: [[Livestock, "breed"]], colors: [[Livestock, "color"]],
};

export async function getMaintenanceUsage(type, id) {
    const counts = await Promise.all(references[type].map(async ([Model, field]) => ({ collection: Model.collection.name, count: await Model.countDocuments({ [field]: id }) })));
    return { total: counts.reduce((sum, item) => sum + item.count, 0), collections: counts };
}

export async function getMaintenance(type, { search, municipality, animalType, includeArchived = false, page = 1, limit = 10 }) {
    const Model = maintenanceModels[type];
    const filter = includeArchived ? {} : { deletedAt: null };
    if (search) filter.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const parent = parents[type]?.[0];
    if (parent && (municipality || animalType)) filter[parent] = municipality || animalType;
    const [items, total] = await Promise.all([
        Model.find(filter).populate(parent ? { path: parent, select: "name deletedAt" } : []).sort({ name: 1, _id: 1 }).collation({ locale: "en", strength: 2 }).skip((page - 1) * limit).limit(limit),
        Model.countDocuments(filter),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function checkParent(type, data, previous = {}) {
    const parent = parents[type];
    if (parent) await validateLink(maintenanceModels[parent[1]], data[parent[0]], previous[parent[0]], parent[0]);
}

async function checkDuplicate(type, data, id) {
    const parent = parents[type]?.[0];
    const filter = { name: data.name, deletedAt: null, ...(parent ? { [parent]: data[parent] } : {}), ...(id ? { _id: { $ne: id } } : {}) };
    if (await maintenanceModels[type].exists(filter).collation({ locale: "en", strength: 2 })) throw referenceError("An active item with this name already exists in this group", 409);
}

async function refreshDisplayNames(type, item) {
    // These fields are derived display caches, never accepted as reference input.
    const inventory = type === "crops" ? [Crop, "cropType", "name"] : type === "equipments" ? [Equipment, "equipmentType", "name"] : type === "animals" ? [Livestock, "animalType", "animal"] : null;
    if (inventory) await inventory[0].updateMany({ [inventory[1]]: item._id }, { $set: { [inventory[2]]: item.name } });
    if (type === "municipalities" || type === "barangays") {
        const field = type === "municipalities" ? "municipality" : "barangay";
        for (const Model of [Farm, Farmer]) {
            const records = await Model.find({ [field]: item._id }).select("street municipality barangay").populate([{ path: "municipality", select: "name" }, { path: "barangay", select: "name" }]);
            for (const record of records) await Model.updateOne({ _id: record._id }, { $set: { address: [record.street, record.barangay?.name, record.municipality?.name].filter(Boolean).join(", ") } });
        }
    }
}

export async function saveMaintenance(type, data, id) {
    const Model = maintenanceModels[type];
    const previous = id ? await Model.findOne({ _id: id, deletedAt: null }) : null;
    if (id && !previous) throw referenceError("Active item not found", 404);
    const parent = parents[type]?.[0];
    if (previous && parent && data[parent] !== undefined && idOf(data[parent]) !== idOf(previous[parent]) && (await getMaintenanceUsage(type, id)).total > 0) throw referenceError("Cannot change the parent of an item already used by records", 409);
    await checkParent(type, data, previous ?? {});
    await checkDuplicate(type, { ...(previous?.toObject() ?? {}), ...data }, id);
    try {
        const item = id ? await Model.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: data }, { new: true, runValidators: true }) : await Model.create(data);
        if (previous && item.name !== previous.name) await refreshDisplayNames(type, item);
        await createLog({ entityType: "maintenance", entityId: item._id, message: `${type}: ${item.name} ${id ? "updated" : "created"}.` });
        return item;
    } catch (error) {
        if (error.code === 11000) throw referenceError("An active item with this name already exists in this group", 409);
        throw error;
    }
}

export async function archiveMaintenance(type, id, restore = false) {
    const Model = maintenanceModels[type];
    const item = await Model.findOne({ _id: id, deletedAt: restore ? { $ne: null } : null });
    if (!item) throw referenceError("Item not found", 404);
    if (restore) {
        await checkParent(type, item.toObject());
        await checkDuplicate(type, item.toObject(), id);
    } else {
        const child = type === "municipalities" ? ["barangays", "municipality"] : type === "animals" ? ["breeds", "animalType"] : null;
        if (child && await maintenanceModels[child[0]].exists({ [child[1]]: id, deletedAt: null })) throw referenceError(`Archive active ${child[0]} first. This item still has active children.`, 409);
    }
    item.deletedAt = restore ? null : new Date();
    try { await item.save(); } catch (error) {
        if (error.code === 11000) throw referenceError("Cannot restore: an active item with this name already exists", 409);
        throw error;
    }
    await createLog({ entityType: "maintenance", entityId: item._id, message: `${type}: ${item.name} ${restore ? "restored" : "archived"}.` });
    return item;
}

export async function getLookups(types) {
    const selected = types ? types.split(",") : Object.keys(maintenanceModels);
    return Object.fromEntries(await Promise.all(selected.map(async (type) => {
        const parent = parents[type]?.[0];
        const items = await maintenanceModels[type].find({ deletedAt: null }).select(`name ${parent ?? ""}`).sort({ name: 1 }).collation({ locale: "en", strength: 2 }).lean();
        return [type, items.map((item) => ({ _id: item._id, name: item.name, parent: parent ? idOf(item[parent]) : null }))];
    })));
}
