import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import { randomUUID } from "node:crypto";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";
import { assertAssignable, BLOCKED_CONDITIONS } from "../utils/assignment.js";
import { availabilityFilter, inventoryKey, validateRequestAvailability } from "./availability.service.js";

const STAGE_ORDER = ["coordinator", "governor", "head"];

const ENTITY_MODELS = {
    livestock: Livestock,
    equipment: Equipment,
};

const ENTITY_SELECT = {
    livestock: "propertyNumber animal",
    equipment: "propertyNumber name",
};

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

function fail(message, statusCode = 409) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
}

// The inventory writes use compare-and-set filters; this separate request-level
// lock also prevents a release racing a revert (or two decisions on one stage).
async function withRequestLock(id, action) {
    const token = randomUUID();
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null, operationLock: null },
        { $set: { operationLock: token } },
        { new: true },
    );
    if (!request) {
        if (!await Request.exists({ _id: id, deletedAt: null })) fail("Request not found", 404);
        fail("This request is being updated. Please try again.");
    }
    try {
        return await action(request);
    } finally {
        await Request.updateOne({ _id: id, operationLock: token }, { $unset: { operationLock: "" } });
    }
}

const describeLines = (request) => request.lines?.length
    ? request.lines.map((line) => `${line.quantity} × ${line.key}`).join(", ")
    : `${request.entityIds.length} ${request.entityType} item(s)`;

async function ensureRequestLines(request) {
    if (request.lines?.length) return;
    const docs = await ENTITY_MODELS[request.entityType].find({ _id: { $in: request.entityIds } }).lean();
    if (docs.length !== request.entityIds.length || !docs.length) fail("Legacy request contains missing units; migrate/repair it before approval");
    const grouped = new Map();
    for (const doc of docs) {
        const key = doc[inventoryKey(request.entityType)];
        grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    request.lines = [...grouped].map(([key, quantity]) => ({ key, quantity }));
}

function assertEarlierStagesApproved(request, role) {
    const chain = request.entityType === "livestock" ? ["coordinator", "head"] : STAGE_ORDER;
    const index = chain.indexOf(role);
    if (index < 0 || chain.slice(0, index).some((stage) => request.approvalStatus[stage]?.status !== "approved")) {
        fail("All earlier stages must approve before this decision");
    }
}

async function populateEntities(requests) {
    const idsByType = { livestock: new Set(), equipment: new Set() };

    for (const r of requests) {
        if (idsByType[r.entityType]) {
            for (const id of r.entityIds) {
                idsByType[r.entityType].add(String(id));
            }
        }
    }

    const [livestockDocs, equipmentDocs] = await Promise.all([
        idsByType.livestock.size
            ? Livestock.find({ _id: { $in: [...idsByType.livestock] } })
                .select(ENTITY_SELECT.livestock)
                .lean()
            : [],
        idsByType.equipment.size
            ? Equipment.find({ _id: { $in: [...idsByType.equipment] } })
                .select(ENTITY_SELECT.equipment)
                .lean()
            : [],
    ]);

    const entityMap = new Map();
    for (const doc of livestockDocs) entityMap.set(String(doc._id), doc);
    for (const doc of equipmentDocs) entityMap.set(String(doc._id), doc);

    return requests.map((r) => {
        const entities = r.entityIds.map((id) => entityMap.get(String(id))).filter(Boolean);
        const grouped = new Map();
        for (const doc of entities) {
            const key = doc[inventoryKey(r.entityType)];
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
        }
        return { ...r, entities, lines: r.lines?.length ? r.lines : [...grouped].map(([key, quantity]) => ({ key, quantity })) };
    });
}

// Mirrors attachRelatedRecords in farmer.service.js — pulls each
// request's audit trail from Log (entityType: "request") and merges it
// in as `history`, newest first (getLogsForEntities already sorts by
// createdAt desc).
async function attachHistory(requests, associationId) {
    const requestIds = requests.map((r) => r._id);

    if (!requestIds.length) return [];

    const logsByRequestId = await getLogsForEntities(
        "request",
        requestIds,
        associationId,
    );

    // Resolve names in older revert messages without rewriting the saved audit.
    const previousReviewerPattern = /Previous decision: by ([0-9a-f]{24}) at /gi;
    const reviewerIds = new Set();
    for (const history of logsByRequestId.values()) {
        for (const entry of history) {
            for (const match of entry.message.matchAll(previousReviewerPattern)) reviewerIds.add(match[1]);
        }
    }
    const reviewers = reviewerIds.size
        ? await User.find({ _id: { $in: [...reviewerIds] } }).select("fullname").lean()
        : [];
    const names = new Map(reviewers.map((user) => [String(user._id), user.fullname?.trim() || "Unknown reviewer"]));

    return requests.map((r) => {
        const key = r._id.toString();
        return {
            ...r,
            history: (logsByRequestId.get(key) ?? []).map((entry) => ({
                ...entry,
                message: entry.message.replace(previousReviewerPattern, (_, userId) =>
                    `Previous decision: by ${names.get(userId) ?? "Unknown reviewer (account unavailable)"} at `,
                ),
            })),
        };
    });
}

const resolveAssociationId = async (authenticatedUserId) => {
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

// Resolves the association's assigned user so approval/release/rejection
// emails have somewhere to go. Returns null (rather than throwing) when
// there's no association or no user email on file, so callers can just
// skip sending in that case — mirrors the tolerant "unaffiliated user"
// handling already used in createRequest's log message.
async function getAssociationRecipient(associationId) {
    if (!associationId) return null;

    const association = await Association.findById(associationId)
        .select("name user")
        .populate({ path: "user", select: "fullname email" });

    if (!association?.user?.email) return null;

    return {
        email: association.user.email,
        name: association.user.fullname || association.name || "there",
    };
}

function mapItemsForEmail(entityType, docs) {
    return docs.map((doc) => ({
        label: entityType === "livestock" ? doc.animal : doc.name,
        propertyNumber: doc.propertyNumber,
    }));
}

async function sendRequestApprovedEmail(request) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    const EntityModel = ENTITY_MODELS[request.entityType];
    const reservedDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        reservedBy: request._id,
    })
        .select(ENTITY_SELECT[request.entityType])
        .lean();

    await emailQueue.add(EMAIL_JOBS.REQUEST_APPROVED, {
        type: EMAIL_JOBS.REQUEST_APPROVED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            requestedItems: describeLines(request),
            entityType: request.entityType,
            items: mapItemsForEmail(request.entityType, reservedDocs),
        },
    });
}

async function sendRequestReleasedEmail(request, releasedDocs, isPartial) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REQUEST_RELEASED, {
        type: EMAIL_JOBS.REQUEST_RELEASED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            requestedItems: describeLines(request),
            entityType: request.entityType,
            items: mapItemsForEmail(request.entityType, releasedDocs),
            isPartial,
        },
    });
}

async function sendRequestRejectedEmail(request, role, remarks) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REQUEST_REJECTED, {
        type: EMAIL_JOBS.REQUEST_REJECTED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            requestedItems: describeLines(request),
            stage: humanize(role),
            remarks: remarks || "",
        },
    });
}

export const createRequest = async (data, authenticatedUserId) => {
    const resolvedAssociationId = await resolveAssociationId(authenticatedUserId);
    await validateRequestAvailability(data.entityType, data.lines);

    const request = await Request.create({
        ...data,
        entityIds: [],
        association: resolvedAssociationId || undefined,
        approvalStatus: {
            coordinator: { status: "pending" },
        },
    });

    // Always logged on submission, regardless of whether the requester
    // belongs to an association — falls back to a generic subject rather
    // than skipping the log entirely.
    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const submitterLabel = association?.name ?? "An unaffiliated user";

    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `${submitterLabel} submitted a request "${request.title}" for ${describeLines(request)}.`,
    });

    return request;
};

export const updateRequest = async (id, data, actingUser) => withRequestLock(id, async (request) => {
    const associationId = await resolveAssociationId(actingUser?._id);
    if (!associationId || String(request.association) !== String(associationId)) fail("You may only edit your association's requests", 403);
    if (request.releaseStatus !== "pending" || request.releasedIds?.length || STAGE_ORDER.some((stage) => ["approved", "denied"].includes(request.approvalStatus[stage]?.status))) {
        fail("A request cannot be edited after any stage has decided");
    }
    if (data.entityType && data.entityType !== request.entityType && !data.lines) fail("Select names/types for the new entity type", 400);
    if (!data.lines) await ensureRequestLines(request);
    await validateRequestAvailability(data.entityType ?? request.entityType, data.lines ?? request.lines);
    request.set(data);
    request.entityIds = [];
    await request.save();
    return request;
});

export const updateRequestApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;

    if (!STAGE_ORDER.includes(role)) {
        const error = new Error("Only coordinator, governor, or head users can review requests");
        error.statusCode = 403;
        throw error;
    }

    return withRequestLock(id, async (request) => {
        const currentStageEntry = request.approvalStatus?.[role];
        if (!currentStageEntry) fail("This request is not currently awaiting your review", 403);
        if (currentStageEntry.status !== "pending") fail("This stage has already been reviewed");
        assertEarlierStagesApproved(request, role);
        if (request.releaseStatus !== "pending") fail("Released requests cannot be reviewed");
        await applyDecision(request, status, remarks, actingUser);
        await createLog({
            entityType: "request", entityId: request._id, association: request.association,
            message: `${humanize(role)} has ${status} the request "${request.title}".${remarks ? ` Remarks: "${remarks}"` : ""}`,
        });
        await notifyDecision(request, status, remarks, role);
        return request;
    });
};

async function applyDecision(request, status, remarks, actingUser) {
    const role = actingUser.role;
    const wasHeadApproved = request.approvalStatus.head?.status === "approved";
    if (role === "head" && status === "approved") await reserveRequestItems(request);
    request.approvalStatus[role] = {
        status,
        approvedBy: actingUser._id,
        approvedAt: new Date(),
        remarks: remarks || "",
    };

    if (status === "approved") {
        if (role === "coordinator") {
            const nextStage = request.entityType === "livestock" ? "head" : "governor";
            request.approvalStatus[nextStage] = { status: "pending" };
        } else if (role === "governor") {
            request.approvalStatus.head = { status: "pending" };
        }
    } else if (role === "governor") {
        request.approvalStatus.head = undefined;
    } else if (role === "head") {
        request.entityIds = [];
    }
    try {
        await request.save();
    } catch (error) {
        if (role === "head" && status === "approved") {
            await ENTITY_MODELS[request.entityType].updateMany({ reservedBy: request._id }, { $unset: { reservedBy: "" } });
        }
        throw error;
    }
    if (role === "head" && status === "denied" && wasHeadApproved) {
        await ENTITY_MODELS[request.entityType].updateMany(
            { reservedBy: request._id }, { $unset: { reservedBy: "" } },
        );
    }
}

async function notifyDecision(request, status, remarks, role) {
    if (status === "denied") return sendRequestRejectedEmail(request, role, remarks);
    if (role !== "head") return;
    const docs = await ENTITY_MODELS[request.entityType].find({ _id: { $in: request.entityIds } }).select(ENTITY_SELECT[request.entityType]).lean();
    await createLog({
        entityType: "request", entityId: request._id, association: request.association,
        message: `Request "${request.title}" has been fully approved: ${describeLines(request)}. Reserved units: ${docs.map((doc) => doc.propertyNumber).join(", ")}.`,
    });
    await sendRequestApprovedEmail(request);
}

export const revertRequestApproval = async (id, { status, reason }, actingUser) => {
    const role = actingUser?.role;
    if (!["governor", "head"].includes(role)) fail("Only governor or head users can change their own decision", 403);
    if (!["approved", "denied"].includes(status)) fail("The new decision must be approved or denied", 400);
    return withRequestLock(id, async (request) => {
        const entry = request.approvalStatus[role];
        if (!entry) fail("This request has no decision for your role", 403);
        if (!["approved", "denied"].includes(entry.status)) fail("Your stage has not been reviewed yet");
        if (entry.status === status) fail("The new decision must differ from the current decision");
        if (request.releaseStatus !== "pending" || request.releasedIds?.length) fail("Cannot change a decision after any items have been released");
        if (request.approvalStatus.head?.status === "approved") {
            const reserved = await ENTITY_MODELS[request.entityType].countDocuments({ _id: { $in: request.entityIds }, reservedBy: request._id });
            if (reserved !== request.entityIds.length || !reserved) fail("Cannot change a decision: assigned units have already left this request's reservation");
        }
        // A denied governor has no head stage yet. A governor who approved may
        // change their decision only until head acts.
        if (role === "governor" && (request.approvalStatus.head?.status !== "pending") && (entry.status === "approved" || request.approvalStatus.head)) {
            fail("Head has already acted; the governor can no longer change this decision");
        }
        if (status === "approved") assertEarlierStagesApproved(request, role);
        const previous = entry.toObject();
        const previousReviewer = previous.approvedBy
            ? String(previous.approvedBy) === String(actingUser._id) && actingUser.fullname?.trim()
                ? actingUser
                : await User.findById(previous.approvedBy).select("fullname").lean()
            : null;
        const previousReviewerName = previousReviewer?.fullname?.trim() || "Unknown reviewer (account unavailable)";
        await applyDecision(request, status, reason, actingUser);
        await createLog({
            entityType: "request", entityId: request._id, association: request.association,
            message: `${humanize(role)} changed their decision on request "${request.title}" from ${previous.status} to ${status}. Reason: "${reason}". Previous decision: by ${previousReviewerName} at ${previous.approvedAt?.toISOString() ?? "unknown"}; remarks: "${previous.remarks ?? ""}".`,
        });
        await notifyDecision(request, status, reason, role);
        return request;
    });
};

export async function assignUnitsForRequest(request) {
    if (request.releaseStatus !== "pending" || request.releasedIds?.length) fail("Released requests cannot be assigned again");
    if (request.approvalStatus.head?.status === "approved") fail("Approved requests must be reverted before assigning units again");
    const EntityModel = ENTITY_MODELS[request.entityType];
    await ensureRequestLines(request);
    // Recover any leftover reservations from a failed earlier approval attempt.
    await EntityModel.updateMany({ reservedBy: request._id }, { $unset: { reservedBy: "" } });
    const chosen = [];
    try {
        for (const line of request.lines) {
            const filter = { ...availabilityFilter(request.entityType), [inventoryKey(request.entityType)]: line.key };
            const docs = await EntityModel.find(filter).sort({ createdAt: 1, propertyNumber: 1, _id: 1 }).limit(line.quantity).select("_id");
            if (docs.length !== line.quantity) fail(`Only ${docs.length} ${line.key} available`);
            const ids = docs.map((doc) => doc._id);
            const result = await EntityModel.updateMany({ ...filter, _id: { $in: ids } }, { $set: { reservedBy: request._id } });
            if (result.modifiedCount !== line.quantity) fail(`Stock changed for ${line.key}; please try approving again`);
            chosen.push(...ids);
        }
        await checkRequestConditions(request.entityType, chosen);
        request.entityIds = chosen;
    } catch (error) {
        // Includes units claimed in the failing line, not only completed lines.
        await EntityModel.updateMany({ reservedBy: request._id }, { $unset: { reservedBy: "" } });
        throw error;
    }
}

async function reserveRequestItems(request) {
    await assignUnitsForRequest(request);
}

export const releaseRequest = async (id) => withRequestLock(id, async (request) => {

    if (request.approvalStatus?.head?.status !== "approved") {
        const error = new Error("Request must be fully approved before it can be released");
        error.statusCode = 409;
        throw error;
    }

    if (request.releaseStatus === "released") {
        const error = new Error("Request has already been fully released");
        error.statusCode = 409;
        throw error;
    }

    const EntityModel = ENTITY_MODELS[request.entityType];
    assertEarlierStagesApproved(request, "head");
    await ensureRequestLines(request);

    // Select the display fields for this entity type up front (not just
    // _id) — needed below to write a readable per-item log once release
    // succeeds, without a second round-trip to re-fetch them.
    const availableDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        deletedAt: null,
        reservedBy: request._id,
        association: null,
        condition: { $nin: BLOCKED_CONDITIONS[request.entityType] },
    }).select(`_id ${ENTITY_SELECT[request.entityType]}`);

    const availableIds = availableDocs.map((doc) => doc._id);

    if (availableIds.length === 0) {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Release attempted for request "${request.title}" but no reserved items were available to release.`,
        });
        return request;
    }

    await EntityModel.updateMany(
        { _id: { $in: availableIds }, reservedBy: request._id, association: null, deletedAt: null, condition: { $nin: BLOCKED_CONDITIONS[request.entityType] } },
        {
            $set: {
                association: request.association,
                status: request.association ? "assigned" : "available",
            },
            $unset: { reservedBy: "" },
            ...(request.entityType === "livestock" ? { $inc: { __v: 1 } } : {}),
        }
    );

    const releasedDocs = await EntityModel.find({ _id: { $in: availableIds }, reservedBy: null, association: request.association ?? null }).select("_id");
    const newlyReleased = new Set(releasedDocs.map((doc) => String(doc._id)));
    const actuallyReleasedDocs = availableDocs.filter((doc) => newlyReleased.has(String(doc._id)));
    const releasedSet = new Set([...(request.releasedIds ?? []).map(String), ...releasedDocs.map((doc) => String(doc._id))]);
    request.releasedIds = [...releasedSet];
    const requestedQuantity = request.lines.reduce((total, line) => total + line.quantity, 0);
    request.releaseStatus = releasedSet.size === requestedQuantity ? "released" : releasedSet.size ? "partial" : "pending";

    await request.save();

    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const associationLabel = association?.name ?? "the association";

    // One log per released item, on the entity's own log (equipment or
    // livestock), so it shows up in that item's history alongside its
    // other assignment/return entries — not just as a single aggregate
    // count on the request's log.
    for (const doc of actuallyReleasedDocs) {
        const itemLabel =
            request.entityType === "livestock"
                ? `${doc.animal} (${doc.propertyNumber})`
                : `${doc.name} (${doc.propertyNumber})`;

        await createLog({
            entityType: request.entityType,
            entityId: doc._id,
            association: request.association,
            message: `${itemLabel} has been released from request "${request.title}" and added to ${associationLabel}.`,
        });
    }

    await sendRequestReleasedEmail(
        request,
        actuallyReleasedDocs,
        request.releaseStatus === "partial"
    );

    if (request.releaseStatus === "released") {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been fully released. All ${requestedQuantity} item(s) have been added to the association.`,
        });
    } else {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been partially released. ${releasedSet.size} of ${requestedQuantity} item(s) were added to the association; the remainder are not currently releasable.`,
        });
    }

    return request;
});

export const deleteRequest = async (id, actingUser) => withRequestLock(id, async (request) => {
    const associationId = await resolveAssociationId(actingUser?._id);
    if (!associationId || String(request.association) !== String(associationId)) fail("You may only archive your association's requests", 403);
    if (request.releaseStatus !== "pending" || request.releasedIds?.length || STAGE_ORDER.some((stage) => ["approved", "denied"].includes(request.approvalStatus[stage]?.status))) {
        fail("A request cannot be archived after any stage has decided");
    }
    request.deletedAt = new Date();
    await request.save();
    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `Request "${request.title}" has been deleted.`,
    });

    return request;
});

async function checkRequestConditions(type, ids) {
    const docs = await ENTITY_MODELS[type].find({ _id: { $in: ids }, deletedAt: null }).select("condition");
    if (docs.length !== ids.length) fail("One or more assigned units are no longer available");
    for (const doc of docs) assertAssignable(type, doc.condition);
}

function buildOverallStatusFilter(status) {
    const DENIED_AT_ANY_STAGE = [
        { "approvalStatus.coordinator.status": "denied" },
        { "approvalStatus.governor.status": "denied" },
        { "approvalStatus.head.status": "denied" },
    ];

    if (status === "denied") {
        return { $or: DENIED_AT_ANY_STAGE };
    }
    if (status === "approved") {
        return { "approvalStatus.head.status": "approved", $nor: DENIED_AT_ANY_STAGE };
    }
    return {
        $nor: [...DENIED_AT_ANY_STAGE, { "approvalStatus.head.status": "approved" }],
    };
}

export const getRequests = async ({
    status,
    severity,
    search,
    stage,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (severity) filter.severity = severity;
    if (associationId) filter.association = associationId;
    if (search) filter.title = new RegExp(escapeRegex(search), "i");

    if (stage) filter[`approvalStatus.${stage}`] = { $exists: true };
    if (status) Object.assign(filter, ["governor", "head"].includes(stage)
        ? { [`approvalStatus.${stage}.status`]: status }
        : buildOverallStatusFilter(status));

    if (all) {
        const requests = await Request.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
        const withEntities = await populateEntities(requests);
        return {
            requests: await attachHistory(withEntities, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        Request.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Request.countDocuments(filter),
    ]);

    const withEntities = await populateEntities(requests);

    return {
        requests: await attachHistory(withEntities, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
