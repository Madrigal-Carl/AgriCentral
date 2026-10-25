export const REPORT_CONDITIONS = {
    farm: ["planted", "growing", "withered", "harvested", "damaged"],
    equipment: ["excellent", "good", "maintenance", "damaged", "unusable"],
    livestock: ["healthy", "pregnant", "sick", "injured", "deceased"],
};

export function getReportItems(report) {
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
    if (data.entityType === "farm") return { ...data, items: [] };
    const items = (data.items ?? []).map((entry) => ({
        item: entry.itemId ?? entry.item, condition: entry.condition, severity: entry.severity ?? "medium",
    }));
    return { ...data, items, itemIds: items.map((entry) => entry.item), severity: highestSeverity(items), condition: undefined, parentId: null };
}
