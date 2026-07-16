import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";

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

    return requests.map((r) => ({
        ...r,
        entities: r.entityIds
            .map((id) => entityMap.get(String(id)))
            .filter(Boolean),
    }));
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

    return requests.map((r) => {
        const key = r._id.toString();
        return {
            ...r,
            history: logsByRequestId.get(key) ?? [],
        };
    });
}

const resolveAssociationId = async (authenticatedUserId) => {
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

export const createRequest = async (data, authenticatedUserId) => {
    const resolvedAssociationId = await resolveAssociationId(authenticatedUserId);

    const EntityModel = ENTITY_MODELS[data.entityType];
    const entityExists = await EntityModel.countDocuments({
        _id: { $in: data.entityIds },
        deletedAt: null,
    });
    if (entityExists !== data.entityIds.length) {
        const error = new Error(`One or more selected ${data.entityType} items were not found`);
        error.statusCode = 404;
        throw error;
    }

    const request = await Request.create({
        ...data,
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
        message: `${submitterLabel} submitted a request "${request.title}" for ${humanize(request.entityType)}.`,
    });

    return request;
};

export const updateRequest = async (id, data) => {
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return request;
};

export const updateRequestApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;

    if (!STAGE_ORDER.includes(role)) {
        const error = new Error("Only coordinator, governor, or head users can review requests");
        error.statusCode = 403;
        throw error;
    }

    const request = await Request.findOne({ _id: id, deletedAt: null });

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const currentStageEntry = request.approvalStatus?.[role];

    if (!currentStageEntry) {
        const error = new Error("This request is not currently awaiting your review");
        error.statusCode = 403;
        throw error;
    }

    if (currentStageEntry.status !== "pending") {
        const error = new Error("This stage has already been reviewed");
        error.statusCode = 409;
        throw error;
    }

    request.approvalStatus[role] = {
        status,
        approvedBy: actingUser._id,
        approvedAt: new Date(),
        remarks: remarks || "",
    };

    const stageLabel = humanize(role);
    const decisionVerb = status === "approved" ? "approved" : "denied";
    const remarksSuffix = remarks ? ` Remarks: "${remarks}"` : "";

    // Single decision log per stage — this is the log, full stop.
    // No separate "now awaiting the next stage" entry: the next
    // reviewer's own decision log, once they act, speaks for itself.
    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `${stageLabel} has ${decisionVerb} the request "${request.title}".${remarksSuffix}`,
    });

    if (status === "approved") {
        if (role === "coordinator") {
            const nextStage = request.entityType === "livestock" ? "head" : "governor";
            request.approvalStatus[nextStage] = { status: "pending" };
        } else if (role === "governor") {
            request.approvalStatus.head = { status: "pending" };
        } else if (role === "head") {
            await reserveRequestItems(request);

            await createLog({
                entityType: "request",
                entityId: request._id,
                association: request.association,
                message: `Request "${request.title}" has been fully approved. ${request.entityIds.length} item(s) have been reserved pending release.`,
            });
        }
    }

    await request.save();
    return request;
};

async function reserveRequestItems(request) {
    const EntityModel = ENTITY_MODELS[request.entityType];

    await EntityModel.updateMany(
        {
            _id: { $in: request.entityIds },
            deletedAt: null,
            association: null,
            reservedBy: null,
        },
        { $set: { reservedBy: request._id } }
    );
}

export const releaseRequest = async (id) => {
    const request = await Request.findOne({ _id: id, deletedAt: null });

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

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

    // Select the display fields for this entity type up front (not just
    // _id) — needed below to write a readable per-item log once release
    // succeeds, without a second round-trip to re-fetch them.
    const availableDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        deletedAt: null,
        reservedBy: request._id,
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
        { _id: { $in: availableIds } },
        {
            $set: {
                association: request.association,
            },
            $unset: { reservedBy: "" },
        }
    );

    request.releaseStatus =
        availableIds.length === request.entityIds.length ? "released" : "partial";

    await request.save();

    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const associationLabel = association?.name ?? "the association";

    // One log per released item, on the entity's own log (equipment or
    // livestock), so it shows up in that item's history alongside its
    // other assignment/return entries — not just as a single aggregate
    // count on the request's log.
    for (const doc of availableDocs) {
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

    if (request.releaseStatus === "released") {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been fully released. All ${availableIds.length} item(s) have been added to the association.`,
        });
    } else {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been partially released. ${availableIds.length} of ${request.entityIds.length} item(s) were added to the association; the remainder are no longer available.`,
        });
    }

    return request;
};

export const deleteRequest = async (id) => {
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `Request "${request.title}" has been deleted.`,
    });

    return request;
};

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
        return { "approvalStatus.head.status": "approved" };
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
    if (status) Object.assign(filter, buildOverallStatusFilter(status));

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