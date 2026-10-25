import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";

export const inventoryModels = { equipment: Equipment, livestock: Livestock };
export const inventoryKey = (type) => type === "equipment" ? "name" : "animal";

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
        { $sort: { _id: 1 } },
        { $project: { _id: 0, [key]: "$_id", available: 1 } },
    ]);
}

export async function validateRequestAvailability(type, lines) {
    for (const line of lines) {
        const available = await inventoryModels[type].countDocuments({
            ...availabilityFilter(type), [inventoryKey(type)]: line.key,
        });
        if (line.quantity > available) {
            const error = new Error(`Only ${available} ${line.key} available`);
            error.statusCode = 409;
            throw error;
        }
    }
}
