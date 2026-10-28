import { getCropReportEntries, REPORT_CONDITIONS } from "./reportItems.js";

const idOf = (value) => String(value?._id ?? value ?? "");

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

export function hasFarmReportMeasurements(report) {
    const entries = getCropReportEntries(report);
    const ids = report.itemIds?.map(idOf) ?? [];
    if (!report.reportedAt || !Number.isFinite(new Date(report.reportedAt).getTime())) return false;
    if (!entries.length || entries.length !== ids.length || new Set(entries.map((entry) => idOf(entry.crop))).size !== entries.length) return false;
    return entries.every((entry) => ids.includes(idOf(entry.crop))
        && REPORT_CONDITIONS.farm.includes(entry.condition)
        && (entry.quantity === undefined || (Number.isFinite(entry.quantity) && entry.quantity > 0))
        && (!["planted", "destroyed"].includes(entry.condition) || (Number.isFinite(entry.quantity) && entry.quantity > 0))
        && (entry.condition !== "harvested" || (Number.isFinite(entry.yieldKg) && entry.yieldKg > 0)));
}

// Replaying the source reports makes edits, withdrawals and deletions reversible.
// Never use approval time: backdated events belong at their original report date.
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
            if (!["planted", "harvested", "destroyed"].includes(entry.condition)) continue;
            const crop = cropById.get(idOf(entry.crop));
            if (!crop?.cropType) continue;
            const cropId = idOf(crop);
            const cropType = idOf(crop.cropType);
            if (!farm.has(cropId)) farm.set(cropId, {
                cropType, name: crop.cropType.name ?? crop.name ?? "Unknown crop", count: 0, yieldKg: 0,
            });
            const total = farm.get(cropId);
            if (entry.condition === "planted") total.count += entry.quantity;
            else if (entry.condition === "destroyed") total.count = Math.max(0, total.count - entry.quantity);
            else {
                total.count = 0;
                total.yieldKg += entry.yieldKg;
            }
        }
    }

    // Keep each inventory crop independent while replaying events. Harvesting
    // one batch must not clear another batch of the same crop type.
    return new Map([...totals].map(([farmId, crops]) => {
        const grouped = new Map();
        for (const crop of crops.values()) {
            if (!grouped.has(crop.cropType)) grouped.set(crop.cropType, { ...crop, count: 0, yieldKg: 0 });
            const total = grouped.get(crop.cropType);
            total.count += crop.count;
            total.yieldKg += crop.yieldKg;
        }
        return [farmId, grouped];
    }));
}
