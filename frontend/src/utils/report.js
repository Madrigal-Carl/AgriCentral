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