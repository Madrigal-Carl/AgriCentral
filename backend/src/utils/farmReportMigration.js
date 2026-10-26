// Conservative, repeatable migration: preserve evidence, never manufacture approval
// or infer reported measurements from today's mutable inventory/farm quantities.
export function buildFarmReportMigration(report) {
    if (report.entityType !== "farm") return null;
    const changes = {};
    if (!report.reportedAt) changes.reportedAt = report.createdAt;
    if (!report.submittedByRole) changes.submittedByRole = report.approvalStatus?.aew ? "far" : "aew";
    const stages = report.approvalStatus ?? {};
    if (!stages.aew || (stages.aew.status !== "approved" && stages.coordinator)) {
        if (!report.legacyApprovalStatus) changes.legacyApprovalStatus = stages;
        changes.approvalStatus = { aew: stages.aew ?? { status: "pending" } };
    } else if (stages.aew.status === "approved" && !stages.coordinator) {
        changes["approvalStatus.coordinator"] = { status: "pending" };
    }
    return Object.keys(changes).length ? { $set: changes } : null;
}
