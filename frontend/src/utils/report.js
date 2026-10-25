// A report is single-stage: it only ever carries ONE of these two
// subdocs, never both — that's what marks who submitted it and who
// reviews it.
//   approvalStatus.aew present         -> far-submitted, reviewed by aew
//   approvalStatus.coordinator present -> aew-submitted, reviewed by coordinator
export function getReviewerRole(report) {
    if (report?.approvalStatus?.aew) return "aew";
    if (report?.approvalStatus?.coordinator) return "coordinator";
    return null;
}

export function getReportStatus(report) {
    const stage = getReviewerRole(report);
    if (!stage) return "pending";
    return report.approvalStatus[stage]?.status ?? "pending";
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
        return {
            ...entity,
            itemId: String(entry.itemId ?? entity._id ?? entry.item),
            condition: entry.condition ?? report.condition,
            severity: entry.severity ?? report.severity ?? "medium",
        };
    });
}

export function getReportSeverity(report) {
    if (report.entityType === "farm") return report.severity;
    const order = ["low", "medium", "high", "critical"];
    return order[Math.max(0, ...getReportItems(report).map((item) => order.indexOf(item.severity)))];
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
