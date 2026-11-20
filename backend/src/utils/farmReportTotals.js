import { cropEntryStage, getCropReportEntries, REPORT_CONDITIONS } from "./reportItems.js";
import { STAGE_AREA_FIELD, validateStageData } from "./cropStageFields.js";

const idOf = (value) => String(value?._id ?? value ?? "");
const isPositive = (value) => Number.isFinite(value) && value > 0;

export const APPROVED_FARM_REPORT_FILTER = {
    entityType: "farm",
    deletedAt: null,
    "approvalStatus.aew.status": "approved",
    "approvalStatus.coordinator.status": "approved",
};

export function isFarmReportApproved(report) {
    return report.entityType === "farm" && !report.deletedAt
        && report.approvalStatus?.aew?.status === "approved"
        && report.approvalStatus?.coordinator?.status === "approved";
}

// Current entries: a stage whose fields are structurally valid. Legacy
// entries (condition + quantity / yieldKg) keep their old rules: newly
// planted and the old destroyed stage need a quantity, harvested needs yield.
function hasEntryMeasurements(entry) {
    if (entry.stage) return validateStageData(entry.stage, entry.stageData, { checkFuture: false }).length === 0;
    const stage = cropEntryStage(entry);
    if (!REPORT_CONDITIONS.farm.includes(stage)) return false;
    if (entry.quantity !== undefined && !isPositive(entry.quantity)) return false;
    const needsQuantity = stage === "newly_planted" || entry.condition === "destroyed";
    if (needsQuantity && !isPositive(entry.quantity)) return false;
    return stage !== "harvested" || isPositive(entry.yieldKg);
}

export function hasFarmReportMeasurements(report) {
    const entries = getCropReportEntries(report);
    const ids = report.itemIds?.map(idOf) ?? [];
    if (!report.reportedAt || !Number.isFinite(new Date(report.reportedAt).getTime())) return false;
    if (!entries.length || entries.length !== ids.length || new Set(entries.map((entry) => idOf(entry.crop))).size !== entries.length) return false;
    return entries.every((entry) => ids.includes(idOf(entry.crop)) && hasEntryMeasurements(entry));
}

// What one approved entry contributes to its crop's totals.
function entryContribution(entry) {
    const stage = cropEntryStage(entry);
    if (entry.stage) {
        const data = entry.stageData ?? {};
        return {
            stage,
            plantedQuantity: stage === "newly_planted" ? data.seedQuantity ?? 0 : 0,
            areaHa: data[STAGE_AREA_FIELD[stage]],
            yieldKg: stage === "harvested" ? data.totalProductionKg ?? 0 : 0,
        };
    }
    // Legacy entries carry no area; their planted quantity and harvest yield still count.
    return {
        stage,
        plantedQuantity: stage === "newly_planted" ? entry.quantity ?? 0 : 0,
        areaHa: undefined,
        yieldKg: stage === "harvested" ? entry.yieldKg ?? 0 : 0,
    };
}

// Replaying the source reports makes edits, withdrawals and deletions reversible.
// Never use approval time: backdated events belong at their original report date.
// Returns Map(farmId -> Map(cropId -> {
//   cropType, name,
//   stage,           // stage of the latest approved report (by reportedAt)
//   plantedQuantity, // sum of approved newly_planted seedQuantity
//   latestAreaHa,    // area from the latest approved report that has one
//   yieldKg,         // sum of approved harvested totalProductionKg
// })).
export function deriveFarmReportTotals(reports, crops) {
    const cropById = new Map(crops.map((crop) => [idOf(crop), crop]));
    const totals = new Map();
    const ordered = reports.filter((report) => isFarmReportApproved(report) && hasFarmReportMeasurements(report))
        .sort((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt)
            || new Date(a.createdAt) - new Date(b.createdAt)
            || idOf(a).localeCompare(idOf(b)));

    for (const report of ordered) {
        const farmId = idOf(report.parentId);
        if (!totals.has(farmId)) totals.set(farmId, new Map());
        const farm = totals.get(farmId);
        for (const entry of getCropReportEntries(report)) {
            const crop = cropById.get(idOf(entry.crop));
            if (!crop?.cropType) continue;
            const cropId = idOf(crop);
            if (!farm.has(cropId)) farm.set(cropId, {
                cropType: idOf(crop.cropType),
                name: crop.name ?? crop.cropType.name ?? "Unknown crop",
                stage: null,
                plantedQuantity: 0,
                latestAreaHa: null,
                yieldKg: 0,
            });
            const total = farm.get(cropId);
            const contribution = entryContribution(entry);
            total.stage = contribution.stage;
            total.plantedQuantity += contribution.plantedQuantity;
            total.yieldKg += contribution.yieldKg;
            if (isPositive(contribution.areaHa)) total.latestAreaHa = contribution.areaHa;
        }
    }
    return totals;
}
