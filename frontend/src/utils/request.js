const STAGE_ORDER = ["coordinator", "governor", "head"];

// Mirrors the actual approval chain per entity type in
// updateRequestApproval on the backend: equipment goes through all three
// stages, livestock skips governor entirely (coordinator -> head).
function getApprovalChain(entityType) {
    return entityType === "livestock"
        ? ["coordinator", "head"]
        : STAGE_ORDER;
}

// Mirrors buildOverallStatusFilter in request.service.js
export function getOverallStatus(request) {
    const stages = request.approvalStatus || {};
    const deniedAtAnyStage = STAGE_ORDER.some(
        (stage) => stages[stage]?.status === "denied",
    );
    if (deniedAtAnyStage) return "denied";
    if (stages.head?.status === "approved") return "approved";
    return "pending";
}

// The stage currently awaiting review, or null if the request is fully
// resolved (approved/denied) or hasn't been created with any stage yet.
export function getCurrentStage(request) {
    const stages = request.approvalStatus || {};
    return (
        STAGE_ORDER.find((stage) => stages[stage]?.status === "pending") ?? null
    );
}

// True once every stage in this request's actual chain (entity-type
// aware — see getApprovalChain) has approved. This is the gate for
// showing the release action: coordinator is the one who releases once
// the whole chain has signed off.
export function isFullyApproved(request) {
    const stages = request.approvalStatus || {};
    const chain = getApprovalChain(request.entityType);
    return chain.every((stage) => stages[stage]?.status === "approved");
}

// All roles see the same overall pipeline status — a request stays
// "pending" until head has approved it, regardless of who's viewing.
export function getDisplayStatus(row) {
    return getOverallStatus(row);
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

export const releaseStatusTone = {
    pending: "warning",
    partial: "info",
    released: "success",
};

export const releaseStatusLabel = {
    pending: "Not Released",
    partial: "Partially Released",
    released: "Released",
};

export const REQUEST_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
];