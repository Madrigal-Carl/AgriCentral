// Crop reports require AEW followed by Coordinator; other types stay single-stage.
export function getReviewerRole(report) {
    if (report?.entityType === "farm") {
        if (getReportStatus(report) !== "pending") return null;
        return report.approvalStatus?.aew?.status === "approved" ? "coordinator" : "aew";
    }
    if (report?.approvalStatus?.aew) return "aew";
    if (report?.approvalStatus?.coordinator) return "coordinator";
    return null;
}

export function getReportStatus(report) {
    if (report?.entityType === "farm") {
        const stages = report.approvalStatus ?? {};
        if ([stages.aew, stages.coordinator].some((entry) => entry?.status === "denied")) return "denied";
        return stages.aew?.status === "approved" && stages.coordinator?.status === "approved" ? "approved" : "pending";
    }
    const stage = getReviewerRole(report);
    if (!stage) return "pending";
    return report.approvalStatus[stage]?.status ?? "pending";
}

export function getSubmittedByRole(report) {
    return report.submittedByRole ?? (report.approvalStatus?.aew ? "far" : report.approvalStatus?.coordinator ? "aew" : null);
}

export function canWithdrawFarmApproval(report, role) {
    return role === "coordinator" && report.entityType === "farm" && getReportStatus(report) === "approved";
}

export const statusTone = {
    pending: "warning",
    approved: "success",
    denied: "danger",
};

export function getReportItems(report) {
    const items = report.items?.length ? report.items : (report.itemIds ?? []).map((id) => ({ _id: id }));
    return items.map((entry) => {
        const entity = entry.item && typeof entry.item === "object" ? entry.item : entry;
        const measurement = report.cropEntries?.find((crop) => String(crop.crop?._id ?? crop.crop) === String(entry.itemId ?? entity._id ?? entry.item));
        return {
            ...entity,
            itemId: String(entry.itemId ?? entity._id ?? entry.item),
            condition: measurement?.condition ?? entry.condition ?? report.condition,
            severity: measurement?.severity ?? entry.severity ?? report.severity ?? "medium",
            reportedQuantity: measurement?.quantity ?? entry.reportedQuantity,
            yieldKg: measurement?.yieldKg ?? entry.yieldKg,
        };
    });
}

export function getReportSeverity(report) {
    const order = ["low", "medium", "high", "critical"];
    const items = getReportItems(report);
    return items.length ? order[Math.max(0, ...items.map((item) => order.indexOf(item.severity)))] : report.severity ?? "medium";
}

export function reportItemLabel(type, item) {
    const name = type === "livestock" ? item.animal : item.name;
    return name ? `${name}${item.propertyNumber ? ` (${item.propertyNumber})` : ""}` : item.itemId;
}

export const statusLabel = {
    pending: "Pending",
    approved: "Approved",
    denied: "Denied",
};

export const REPORT_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
];
