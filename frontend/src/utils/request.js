import { fmtLongDate } from "./format.js";

const STAGE_ORDER = ["coordinator", "governor", "head"];

// Format the previous-decision timestamp for display only; preserve the precise
// timestamp in stored logs, and leave dates quoted in the reason/remarks alone.
export function formatRequestHistoryMessage(message) {
  return message.replace(
    /(Previous decision: by [^\n]*? at )(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)(?=; remarks:)/g,
    (_, prefix, date) => `${prefix}${fmtLongDate(date)}`,
  );
}

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
    if (getOverallStatus(request) === "denied") return null;
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

// Reviewers see their own decision, not the next reviewer's pending stage.
// Omitting role retains overall pipeline status for workflow/action guards.
export function getDisplayStatus(row, role) {
    if (["governor", "head"].includes(role)) {
        return row.approvalStatus?.[role]?.status ?? getOverallStatus(row);
    }
    return getOverallStatus(row);
}

export const statusTone = {
    pending: "warning",
    approved: "success",
    denied: "danger",
};

export function canRevertDecision(request, role) {
    if (!["governor", "head"].includes(role) || request.releaseStatus !== "pending" || request.releasedIds?.length) return false;
    const status = request.approvalStatus?.[role]?.status;
    if (!["approved", "denied"].includes(status)) return false;
    const head = request.approvalStatus?.head;
    // Denied governors have not opened a head stage yet.
    return role !== "governor" || head?.status === "pending" || (status === "denied" && !head);
}

export function getRequestLines(request) {
    if (request.lines?.length) return request.lines;
    const grouped = new Map();
    for (const entity of request.entities ?? []) {
        const key = entity.name ?? entity.animal;
        grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return [...grouped].map(([key, quantity]) => ({ key, quantity }));
}

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
    pending: "Unreleased",
    partial: "Partially Released",
    released: "Released",
};

export const REQUEST_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
];
