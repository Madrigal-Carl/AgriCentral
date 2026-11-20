import mongoose from "mongoose";
import Crop from "../models/crop.model.js";
import Farm from "../models/farm.model.js";

// A government crop is a batch given to one farmer (Crop.quantity). What is
// planted of it lives on the farms (Farm.crops[].quantities.planted), so the
// farm records are the source of truth:
//   planted total = sum of planted across active farms
//   unplanted     = quantity - planted total (never below zero)
// Crop.unplanted is only a stored copy, kept in sync by syncCropUnplanted.

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id?._id ?? id));

// cropId -> planted on active farms (optionally leaving one farm out).
export async function plantedTotals(cropIds, { excludeFarmId } = {}) {
    const ids = [...new Set(cropIds.map(String))].map(toObjectId);
    if (!ids.length) return new Map();
    const match = { deletedAt: null, "crops.crop": { $in: ids } };
    if (excludeFarmId) match._id = { $ne: toObjectId(excludeFarmId) };
    const rows = await Farm.aggregate([
        { $match: match },
        { $unwind: "$crops" },
        { $match: { "crops.crop": { $in: ids } } },
        { $group: { _id: "$crops.crop", planted: { $sum: { $ifNull: ["$crops.quantities.planted", 0] } } } },
    ]);
    return new Map(rows.map((row) => [String(row._id), row.planted]));
}

// Rewrites Crop.unplanted from the farm records for these government crops.
export async function syncCropUnplanted(cropIds) {
    const crops = await Crop.find({ _id: { $in: [...new Set(cropIds.map(String))] }, ownership: { $ne: "farmer" } })
        .select("quantity unplanted").lean();
    if (!crops.length) return;
    const totals = await plantedTotals(crops.map((c) => c._id));
    const ops = crops
        .map((crop) => ({ crop, unplanted: Math.max(0, (crop.quantity ?? 0) - (totals.get(String(crop._id)) ?? 0)) }))
        .filter(({ crop, unplanted }) => crop.unplanted !== unplanted)
        .map(({ crop, unplanted }) => ({ updateOne: { filter: { _id: crop._id }, update: { $set: { unplanted } } } }));
    if (ops.length) await Crop.bulkWrite(ops);
}
