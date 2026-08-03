import mongoose from "mongoose";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Farm from "../models/farm.model.js";
import Harvest from "../models/harvest.model.js";
import { getDateRange } from "../utils/dateRange.util.js";

const EQUIPMENT_CONDITIONS = ["good", "excellent", "damaged", "maintenance", "unusable"];
const LIVESTOCK_CONDITIONS = ["healthy", "pregnant", "sick", "injured", "deceased"];
const CROP_QUANTITY_KEYS = ["planted", "growing", "withered", "harvested", "damaged"];

// Fills in every enum value with 0 so pie charts don't drop empty
// categories just because nothing in the period matched them.
const fillCategories = (rows, allKeys) => {
    const counts = new Map(rows.map((r) => [r._id, r.count]));
    return allKeys.map((key) => ({
        name: key,
        value: counts.get(key) ?? 0,
    }));
};

// Farm has no standalone display name — only an auto-generated tag
// (FM-001) and an address — so every per-farm chart label combines them.
const FARM_LABEL_EXPR = { $concat: ["$farmDoc.tag", " - ", "$farmDoc.address"] };

export const getAnalytics = async ({ association, period }) => {
    const associationId = association
        ? new mongoose.Types.ObjectId(association)
        : null;

    const { start, end } = getDateRange(period);
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    const baseMatch = {
        deletedAt: null,
        ...(associationId && { association: associationId }),
    };

    const periodMatch = {
        ...baseMatch,
        createdAt: { $gte: start, $lte: end },
    };

    // Harvest is an append-only log — no deletedAt, and it carries its own
    // association snapshot, so it doesn't need a join to filter by it.
    const harvestBaseMatch = {
        ...(associationId && { association: associationId }),
    };

    const harvestPeriodMatch = {
        ...harvestBaseMatch,
        harvestedAt: { $gte: start, $lte: end },
    };

    const [
        equipmentCount,
        livestockCount,
        farmCount,
        equipmentStatusRows,
        livestockHealthRows,
        yieldPerFarmRows,
        cropQuantityRows,
        harvestedInPeriod,
        monthlyYieldRows,
    ] = await Promise.all([
        Equipment.countDocuments(periodMatch),
        Livestock.countDocuments(periodMatch),
        Farm.countDocuments(periodMatch),

        Equipment.aggregate([
            { $match: periodMatch },
            { $group: { _id: "$condition", count: { $sum: 1 } } },
        ]),

        Livestock.aggregate([
            { $match: periodMatch },
            { $group: { _id: "$condition", count: { $sum: 1 } } },
        ]),

        // Yield per farm for the selected period — sourced from Harvest's
        // real per-event dates, not the farm's running quantity totals.
        // Includes the farm's size (ha) alongside harvested quantity.
        Harvest.aggregate([
            { $match: harvestPeriodMatch },
            { $group: { _id: "$farm", harvested: { $sum: "$quantity" } } },
            {
                $lookup: {
                    from: "farms",
                    localField: "_id",
                    foreignField: "_id",
                    as: "farmDoc",
                },
            },
            { $unwind: "$farmDoc" },
            {
                $project: {
                    _id: 0,
                    farm: FARM_LABEL_EXPR,
                    size: "$farmDoc.size",
                    harvested: 1,
                },
            },
            { $sort: { farm: 1 } },
        ]),

        // Crop lifecycle breakdown (planted/growing/withered/damaged) is
        // still approximated off the farm's live crop entries filtered by
        // updatedAt — there's no per-event log for these statuses yet,
        // only "harvested" has one (Harvest), used below instead.
        Farm.aggregate([
            { $match: baseMatch },
            { $unwind: "$crops" },
            { $match: { "crops.updatedAt": { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    planted: { $sum: "$crops.quantities.planted" },
                    growing: { $sum: "$crops.quantities.growing" },
                    withered: { $sum: "$crops.quantities.withered" },
                    damaged: { $sum: "$crops.quantities.damaged" },
                },
            },
        ]),

        // Accurate "harvested" total for the period, replacing the
        // approximate figure the crop-lifecycle aggregation would give.
        Harvest.aggregate([
            { $match: harvestPeriodMatch },
            { $group: { _id: null, harvested: { $sum: "$quantity" } } },
        ]),

        // Full current year, association-filterable only — reads real
        // harvestedAt dates instead of proxying off crops.updatedAt.
        Harvest.aggregate([
            {
                $match: {
                    ...harvestBaseMatch,
                    harvestedAt: { $gte: yearStart, $lt: yearEnd },
                },
            },
            {
                $group: {
                    _id: { farm: "$farm", month: { $month: "$harvestedAt" } },
                    harvested: { $sum: "$quantity" },
                },
            },
            {
                $lookup: {
                    from: "farms",
                    localField: "_id.farm",
                    foreignField: "_id",
                    as: "farmDoc",
                },
            },
            { $unwind: "$farmDoc" },
            {
                $project: {
                    _id: 0,
                    farm: FARM_LABEL_EXPR,
                    month: "$_id.month",
                    harvested: 1,
                },
            },
            { $sort: { month: 1 } },
        ]),
    ]);

    const harvestedTotal = harvestedInPeriod[0]?.harvested ?? 0;

    const cropStatus = CROP_QUANTITY_KEYS.map((key) => {
        if (key === "harvested") {
            return { name: key, value: harvestedTotal };
        }
        return { name: key, value: cropQuantityRows[0]?.[key] ?? 0 };
    });

    return {
        kpis: {
            equipment: equipmentCount,
            livestock: livestockCount,
            farm: farmCount,
            cropYield: harvestedTotal,
        },
        equipment: {
            statusDistribution: fillCategories(equipmentStatusRows, EQUIPMENT_CONDITIONS),
        },
        livestock: {
            healthStatus: fillCategories(livestockHealthRows, LIVESTOCK_CONDITIONS),
        },
        farm: {
            yieldPerFarm: yieldPerFarmRows,
            cropStatus,
            monthlyYieldTrend: monthlyYieldRows,
        },
    };
};