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
    const entries = report.cropEntries ?? [];
    const ids = report.itemIds?.map(idOf) ?? [];
    if (!report.reportedAt || !Number.isFinite(new Date(report.reportedAt).getTime())) return false;
    if (!entries.length || entries.length !== ids.length || new Set(entries.map((entry) => idOf(entry.crop))).size !== entries.length) return false;
    return entries.every((entry) => ids.includes(idOf(entry.crop))
        && (!["planted", "destroyed"].includes(report.condition) || (Number.isFinite(entry.quantity) && entry.quantity > 0))
        && (report.condition !== "harvested" || (Number.isFinite(entry.yieldKg) && entry.yieldKg > 0)));
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
        if (!["planted", "harvested", "destroyed"].includes(report.condition)) continue;
        const farmId = idOf(report.parentId);
        if (!totals.has(farmId)) totals.set(farmId, new Map());
        const farm = totals.get(farmId);
        for (const entry of report.cropEntries) {
            const crop = cropById.get(idOf(entry.crop));
            if (!crop?.cropType) continue;
            const cropType = idOf(crop.cropType);
            if (!farm.has(cropType)) farm.set(cropType, {
                cropType, name: crop.cropType.name ?? crop.name ?? "Unknown crop", count: 0, yieldKg: 0,
            });
            const total = farm.get(cropType);
            if (report.condition === "planted") total.count += entry.quantity;
            else if (report.condition === "destroyed") total.count = Math.max(0, total.count - entry.quantity);
            else {
                total.count = 0;
                total.yieldKg += entry.yieldKg;
            }
        }
    }

    return totals;
}
