import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";
import { maintenanceModels, referenceError } from "../utils/maintenanceLinks.js";

export const inventoryModels = { equipment: Equipment, livestock: Livestock };
export const inventoryKey = (type) => type === "equipment" ? "equipmentType" : "animalType";

export function availabilityFilter(type) {
    return {
        deletedAt: null,
        association: null,
        reservedBy: null,
        status: "available",
        condition: { $nin: BLOCKED_CONDITIONS[type] },
    };
}

export async function getAvailability(type) {
    const key = inventoryKey(type);
    return inventoryModels[type].aggregate([
        { $match: availabilityFilter(type) },
        { $group: { _id: `$${key}`, available: { $sum: 1 } } },
        { $lookup: { from: maintenanceModels[type === "equipment" ? "equipments" : "animals"].collection.name, localField: "_id", foreignField: "_id", as: "reference" } },
        { $unwind: "$reference" },
        { $match: { "reference.deletedAt": null } },
        { $sort: { "reference.name": 1 } },
        { $project: { _id: 0, key: { $toString: "$_id" }, name: "$reference.name", available: 1 } },
    ]);
}

export async function validateRequestAvailability(type, lines, previousLines = []) {
    for (const line of lines) {
        const previous = previousLines.find((item) => String(item.key) === String(line.key) && item.quantity === line.quantity);
        if (previous) { line.name = previous.name; continue; }
        const item = await maintenanceModels[type === "equipment" ? "equipments" : "animals"].findOne({ _id: line.key, deletedAt: null });
        if (!item) throw referenceError("Select an active inventory type");
        line.name = item.name;
        const available = await inventoryModels[type].countDocuments({
            ...availabilityFilter(type), [inventoryKey(type)]: line.key,
        });
        if (line.quantity > available) {
            const error = new Error(`Only ${available} ${item.name} available`);
            error.statusCode = 409;
            throw error;
        }
    }
}
