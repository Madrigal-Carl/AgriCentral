import mongoose from "mongoose";
import Livestock from "../models/livestock.model.js";
import Association from "../models/association.model.js";

export const LIVESTOCK_RELATION_FIELDS = "propertyNumber animal gender breed birthDate condition status association assignedFarmer mother";
export const MOTHER_POPULATE = { path: "mother", match: { deletedAt: null }, select: LIVESTOCK_RELATION_FIELDS };
const idString = (value) => String(value?._id ?? value ?? "").toLowerCase();
const sameAnimal = (first, second) => first?.trim().toLowerCase() === second?.trim().toLowerCase();
const animalPattern = (animal) => new RegExp(`^${animal.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

export function lineageError(message, field = "mother", statusCode = 400) {
    const error = new Error(message);
    error.field = field;
    error.statusCode = statusCode;
    return error;
}

export async function withLivestockLineageTransaction(operation) {
    try {
        return await Livestock.db.transaction(operation, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
    } catch (error) {
        if (error.code === 20 && /transaction/i.test(error.message)) {
            throw lineageError("Livestock offspring updates require MongoDB replica-set transaction support", "mother", 503);
        }
        throw error;
    }
}

export async function livestockAccessFilter(actingUser) {
    if (actingUser?.role !== "far") return {};
    const association = await Association.findOne({ user: actingUser._id, deletedAt: null }).select("_id");
    return { association: association?._id ?? new mongoose.Types.ObjectId("000000000000000000000000") };
}

export function lineageChanged(previous, data) {
    return (data.mother !== undefined && idString(data.mother) !== idString(previous.mother)) ||
        (data.gender !== undefined && data.gender !== previous.gender) ||
        (data.animal !== undefined && !sameAnimal(data.animal, previous.animal));
}

export async function validateLivestockLineage(id, record, session, enforceMotherScope = false) {
    const options = session ? { session } : {};
    if (record.mother) {
        if (idString(record.mother) === idString(id)) throw lineageError("Livestock cannot be its own mother");
        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(idString(record.mother)), deletedAt: null } },
            { $graphLookup: {
                from: Livestock.collection.name,
                startWith: "$mother",
                connectFromField: "mother",
                connectToField: "_id",
                as: "ancestors",
                restrictSearchWithMatch: { deletedAt: null },
            } },
            { $project: { gender: 1, animal: 1, association: 1, assignedFarmer: 1, "ancestors._id": 1 } },
        ];
        const aggregation = Livestock.aggregate(pipeline);
        if (session) aggregation.session(session);
        const [mother] = await aggregation;
        if (!mother) throw lineageError("Selected mother was not found or has been archived");
        if (mother.gender !== "female") throw lineageError("Selected mother must be female");
        if (!sameAnimal(mother.animal, record.animal)) throw lineageError("Selected mother must have the same animal type");
        if (enforceMotherScope && (idString(mother.association) !== idString(record.association) || idString(mother.assignedFarmer) !== idString(record.assignedFarmer))) {
            throw lineageError("Selected mother must belong to the same association and assigned farmer");
        }
        if (mother.ancestors.some((ancestor) => idString(ancestor) === idString(id) || idString(ancestor) === idString(mother._id))) {
            throw lineageError("Selected mother would create a circular ancestry relationship");
        }
        // Writing all inspected ancestors makes concurrent graph edits conflict and retry.
        if (session) await Livestock.updateMany(
            { _id: { $in: [mother._id, ...mother.ancestors.map((ancestor) => ancestor._id)] } },
            { $inc: { __v: 1 } },
            options,
        );
    }
    if (!id) return;
    const childFilter = { mother: id, deletedAt: null };
    if (record.gender !== "female") {
        if (await Livestock.exists(childFilter, options)) throw lineageError("A mother with offspring must remain female; remove the offspring links first", "gender");
    } else {
        const incompatible = await Livestock.exists({
            ...childFilter,
            animal: { $not: animalPattern(record.animal) },
        }, options);
        if (incompatible) throw lineageError("Offspring must keep the same animal type as their mother; remove the offspring links first", "animal");
    }
}

export async function getEligibleLivestockMothers({ animal, assignedFarmer, excludeId }, actingUser) {
    const access = await livestockAccessFilter(actingUser);
    if (excludeId) {
        const current = await Livestock.findOne({ _id: excludeId, deletedAt: null, ...access }).select("assignedFarmer");
        if (!current) throw lineageError("Livestock not found", "mother", 404);
        if (actingUser?.role === "far") assignedFarmer = current.assignedFarmer ?? null;
    }
    const filter = {
        deletedAt: null,
        animal: animalPattern(animal),
        gender: "female",
        ...access,
        ...(actingUser?.role === "far" ? { assignedFarmer: assignedFarmer ?? null } : {}),
    };
    if (excludeId) {
        const [record] = await Livestock.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(excludeId), deletedAt: null } },
            { $graphLookup: {
                from: Livestock.collection.name,
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "mother",
                as: "descendants",
                restrictSearchWithMatch: { deletedAt: null },
            } },
            { $project: { "descendants._id": 1 } },
        ]);
        filter._id = { $nin: [new mongoose.Types.ObjectId(excludeId), ...(record?.descendants ?? []).map((child) => child._id)] };
    }
    return Livestock.find(filter).select(LIVESTOCK_RELATION_FIELDS).sort({ propertyNumber: 1 }).lean();
}
