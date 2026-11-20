import { toCropStage } from "@/constants/data";

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

// Crop reports are one crop per report with a farmer and a stage with its
// fields. Older crop reports (no farmer, several crops, or an entry without
// a stage) are legacy: viewable and reviewable, never edited. The backend
// sends `isLegacy`; the fallback mirrors its rule.
export function isLegacyCropReport(report) {
    if (report?.entityType !== "farm") return false;
    if (typeof report.isLegacy === "boolean") return report.isLegacy;
    const entries = Math.max(report.cropEntries?.length ?? 0, report.itemIds?.length ?? 0);
    return !report.farmer || entries > 1 || !report.cropEntries?.every((entry) => entry.stage);
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
            // Crop entries carry a stage; legacy ones hold old condition names,
            // read through the mapper.
            condition: report.entityType === "farm"
                ? measurement?.stage ?? toCropStage(measurement?.condition ?? entry.condition ?? report.condition)
                : measurement?.condition ?? entry.condition ?? report.condition,
            priority: measurement?.priority ?? entry.priority ?? report.priority ?? "medium",
            reportedQuantity: measurement?.quantity ?? entry.reportedQuantity,
            yieldKg: measurement?.yieldKg ?? entry.yieldKg,
            // Livestock condition reports: { cause, dateOfDeath } for deceased items.
            deceased: entry.deceased,
            // Equipment: reported usage, and the farmer using it (populated
            // as usedBy in listings, a plain id right after a save).
            usageStatus: entry.usageStatus,
            usedBy: entry.usedBy,
            farmer: entry.usedBy?._id ?? entry.farmer,
            // Livestock redispersal: { _id, fullName } in listings, a plain
            // id right after a save.
            fromFarmer: entry.fromFarmer,
            toFarmer: entry.toFarmer,
        };
    });
}

// Livestock reports default to the condition kind (older reports have none).
export const getReportKind = (report) =>
    report?.entityType === "livestock" ? report.reportKind ?? "condition" : undefined;

export function getReportPriority(report) {
    const order = ["low", "medium", "high", "critical"];
    const items = getReportItems(report);
    return items.length ? order[Math.max(0, ...items.map((item) => order.indexOf(item.priority)))] : report.priority ?? "medium";
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
