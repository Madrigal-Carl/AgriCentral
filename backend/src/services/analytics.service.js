import mongoose from "mongoose";
import Farmer from "../models/farmer.model.js";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Farm from "../models/farm.model.js";
import Harvest from "../models/harvest.model.js";
import Association from "../models/association.model.js";
import Log from "../models/log.model.js";
import { entityScopeMatch, farmScopeMatch, harvestScopeMatch, resolveAnalyticsScope } from "./analyticsReportData.service.js";
import { CROP_STAGES, CROP_STAGE_LABELS, STORED_STAGE_KEYS, newlyPlantedQuantity } from "../utils/cropStages.js";

const EQUIPMENT_CONDITIONS = ["good", "excellent", "damaged", "maintenance", "unusable"];
const LIVESTOCK_CONDITIONS = ["healthy", "pregnant", "sick", "injured", "deceased"];
const CROP_QUANTITY_KEYS = CROP_STAGES;

const TOP_FARMS_LIMIT = 6;
const RECENT_ACTIVITIES_LIMIT = 6;

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

// Every query honours the selected year (period ranges and the monthly
// chart) and, when given, the association and/or farmer.
export const getAnalytics = async ({ association, farmer, period, year }) => {
    const scope = await resolveAnalyticsScope({ association, farmer, period, year });
    const { associationId, farmerCropIds, start, end, yearStart, yearEnd } = scope;

    const baseMatch = {
        deletedAt: null,
        ...(associationId && { association: associationId }),
    };

    const createdInPeriod = { createdAt: { $gte: start, $lte: end } };
    // Equipment and livestock: association and/or assigned farmer.
    const periodMatch = {
        deletedAt: null,
        ...entityScopeMatch(scope),
        ...createdInPeriod,
    };
    // Farms: association and/or one of the farm's assigned farmers.
    const farmPeriodMatch = {
        deletedAt: null,
        ...farmScopeMatch(scope),
        ...createdInPeriod,
    };

    // Harvest is an append-only log — no deletedAt, and it carries its own
    // association snapshot; a farmer limits it to that farmer's crops.
    const harvestBaseMatch = harvestScopeMatch(scope);

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
        Farm.countDocuments(farmPeriodMatch),

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

        // Crop stage breakdown (newly planted is derived from planted) is
        // still approximated off the farm's live crop entries filtered by
        // updatedAt — there's no per-event log for these statuses yet,
        // only "harvested" has one (Harvest), used below instead.
        Farm.aggregate([
            { $match: baseMatch },
            { $unwind: "$crops" },
            {
                $match: {
                    "crops.updatedAt": { $gte: start, $lte: end },
                    // With a farmer: only crops assigned to that farmer.
                    ...(farmerCropIds && { "crops.crop": { $in: farmerCropIds } }),
                },
            },
            {
                $group: {
                    _id: null,
                    planted: { $sum: "$crops.quantities.planted" },
                    ...Object.fromEntries(STORED_STAGE_KEYS.map((key) => [key, { $sum: `$crops.quantities.${key}` }])),
                },
            },
        ]),

        // Accurate "harvested" total for the period, replacing the
        // approximate figure the crop-lifecycle aggregation would give.
        Harvest.aggregate([
            { $match: harvestPeriodMatch },
            { $group: { _id: null, harvested: { $sum: "$quantity" } } },
        ]),

        // The full selected year (association and farmer scoped) — reads
        // real harvestedAt dates instead of proxying off crops.updatedAt.
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

    const stageTotals = cropQuantityRows[0] ?? {};
    const cropStatus = CROP_QUANTITY_KEYS.map((key) => {
        const name = CROP_STAGE_LABELS[key];
        if (key === "harvested") {
            return { key, name, value: harvestedTotal };
        }
        if (key === "newly_planted") {
            return { key, name, value: newlyPlantedQuantity(stageTotals) };
        }
        return { key, name, value: stageTotals[key] ?? 0 };
    });

    return {
        // The filters actually applied (period is "year" for a past year).
        filters: { year: scope.year, period: scope.period },
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

// Farmer filter options for the analytics page: only id, name and
// association, so the analytics roles (governor and head included, who
// cannot list farmer records) can pick a farmer.
export const getAnalyticsFarmers = async ({ association } = {}) => {
    const farmers = await Farmer.find({
        deletedAt: null,
        ...(association && { association: new mongoose.Types.ObjectId(association) }),
    })
        .select("firstName lastName association")
        .sort({ firstName: 1, lastName: 1 });
    return farmers.map((farmer) => ({
        _id: farmer._id,
        fullName: farmer.getFullName(),
        association: farmer.association ?? null,
    }));
};

// Powers the dashboard Overview page — all-time KPIs and chart data,
// not period-scoped like getAnalytics above. Same association-scoping
// contract: `associationId` arrives pre-resolved by scopeByAssociationId
// (pinned for `far` users, optional/omitted for everyone else).
export const getOverview = async ({ associationId }) => {
    const associationObjectId = associationId
        ? new mongoose.Types.ObjectId(associationId)
        : null;

    const baseMatch = {
        deletedAt: null,
        ...(associationObjectId && { association: associationObjectId }),
    };

    const harvestMatch = {
        ...(associationObjectId && { association: associationObjectId }),
    };

    const logMatch = associationObjectId ? { association: associationObjectId } : {};

    const [
        associationCount,
        farmerCount,
        farmCount,
        equipmentCount,
        livestockCount,
        livestockConditionRows,
        equipmentConditionRows,
        topFarmHarvestRows,
        recentLogs,
    ] = await Promise.all([
        // Only meaningful for roles not pinned to a single association —
        // `far` users never see this KPI on the frontend, so skip the
        // query entirely when scoped.
        associationObjectId
            ? Promise.resolve(null)
            : Association.countDocuments({ deletedAt: null }),

        Farmer.countDocuments(baseMatch),
        Farm.countDocuments(baseMatch),
        Equipment.countDocuments(baseMatch),
        Livestock.countDocuments(baseMatch),

        Livestock.aggregate([
            { $match: baseMatch },
            { $group: { _id: "$condition", count: { $sum: 1 } } },
        ]),

        Equipment.aggregate([
            { $match: baseMatch },
            { $group: { _id: "$condition", count: { $sum: 1 } } },
        ]),

        // Top farms by all-time harvested quantity — same Harvest-log
        // sourcing as yieldPerFarm above, just not period-bounded and
        // capped to the top N for the dashboard widget.
        Harvest.aggregate([
            { $match: harvestMatch },
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
                    harvested: 1,
                },
            },
            { $sort: { harvested: -1 } },
            { $limit: TOP_FARMS_LIMIT },
        ]),

        Log.find(logMatch).sort({ createdAt: -1 }).limit(RECENT_ACTIVITIES_LIMIT),
    ]);

    return {
        kpis: {
            associations: associationCount,
            farmers: farmerCount,
            farms: farmCount,
            equipment: equipmentCount,
            livestock: livestockCount,
        },
        livestock: {
            healthStatus: fillCategories(livestockConditionRows, LIVESTOCK_CONDITIONS),
        },
        equipment: {
            statusDistribution: fillCategories(equipmentConditionRows, EQUIPMENT_CONDITIONS),
        },
        farm: {
            topHarvested: topFarmHarvestRows,
        },
        activities: recentLogs.map((log) => ({
            id: log._id,
            entityType: log.entityType,
            message: log.message,
            createdAt: log.createdAt,
        })),
    };
};