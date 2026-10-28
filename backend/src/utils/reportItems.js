export const REPORT_CONDITIONS = {
    farm: ["planted", "growing", "withered", "harvested", "damaged", "destroyed"],
    equipment: ["excellent", "good", "maintenance", "damaged", "unusable"],
    livestock: ["healthy", "pregnant", "sick", "injured", "deceased"],
};

export function getCropReportEntries(report) {
    return (report.cropEntries ?? []).map((entry) => ({
        crop: entry.crop,
        condition: entry.condition ?? report.condition,
        severity: entry.severity ?? report.severity ?? "medium",
        quantity: entry.quantity,
        yieldKg: entry.yieldKg,
    }));
}

export function getReportItems(report) {
    if (report.entityType === "farm" && report.cropEntries?.length) {
        return getCropReportEntries(report).map(({ crop, ...entry }) => ({ item: crop, ...entry }));
    }
    if (report.entityType !== "farm" && report.items?.length) return report.items;
    return (report.itemIds ?? []).map((item) => ({
        item, condition: report.condition, severity: report.severity ?? "medium",
    }));
}

export function highestSeverity(items) {
    const order = ["low", "medium", "high", "critical"];
    return order[Math.max(0, ...items.map((item) => order.indexOf(item.severity ?? "medium")))];
}

export function normalizeReportItems(data) {
    if (data.entityType === "farm") {
        const cropEntries = getCropReportEntries(data);
        return { ...data, items: [], cropEntries, severity: highestSeverity(cropEntries), condition: undefined };
    }
    const items = (data.items ?? []).map((entry) => ({
        item: entry.itemId ?? entry.item, condition: entry.condition, severity: entry.severity ?? "medium",
    }));
    return { ...data, items, itemIds: items.map((entry) => entry.item), severity: highestSeverity(items), condition: undefined, parentId: null, cropEntries: [], reportedAt: undefined };
}
