import Report from "../models/report.model.js";
import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";

const STAGE_ROLES = ["aew", "coordinator"];

// entityType here describes what's being reported ON, not who submitted it.
// "farm" reports are actually about specific crops within a farm (parentId),
// so itemIds for that type resolve against Crop, not Farm.
const ENTITY_MODELS = {
    farm: Crop,
    livestock: Livestock,
    equipment: Equipment,
};

const ENTITY_SELECT = {
    farm: "name kilo",
    livestock: "propertyNumber animal",
    equipment: "propertyNumber name",
};

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

async function populateEntities(reports) {
    const idsByType = { farm: new Set(), livestock: new Set(), equipment: new Set() };
    const farmIds = new Set();

    for (const r of reports) {
        if (idsByType[r.entityType]) {
            for (const id of r.itemIds) idsByType[r.entityType].add(String(id));
        }
        if (r.entityType === "farm" && r.parentId) farmIds.add(String(r.parentId));
    }

    const [cropDocs, livestockDocs, equipmentDocs, farmDocs] = await Promise.all([
        idsByType.farm.size
            ? Crop.find({ _id: { $in: [...idsByType.farm] } }).select(ENTITY_SELECT.farm).lean()
            : [],
        idsByType.livestock.size
            ? Livestock.find({ _id: { $in: [...idsByType.livestock] } }).select(ENTITY_SELECT.livestock).lean()
            : [],
        idsByType.equipment.size
            ? Equipment.find({ _id: { $in: [...idsByType.equipment] } }).select(ENTITY_SELECT.equipment).lean()
            : [],
        farmIds.size
            ? Farm.find({ _id: { $in: [...farmIds] } }).select("tag address").lean()
            : [],
    ]);

    const entityMap = new Map();
    for (const doc of [...cropDocs, ...livestockDocs, ...equipmentDocs]) {
        entityMap.set(String(doc._id), doc);
    }
    const farmMap = new Map(farmDocs.map((f) => [String(f._id), f]));

    return reports.map((r) => ({
        ...r,
        items: r.itemIds.map((id) => entityMap.get(String(id))).filter(Boolean),
        parent: r.parentId ? farmMap.get(String(r.parentId)) ?? null : null,
    }));
}

async function attachHistory(reports, associationId) {
    const reportIds = reports.map((r) => r._id);
    if (!reportIds.length) return [];

    const logsByReportId = await getLogsForEntities("report", reportIds, associationId);

    return reports.map((r) => {
        const key = r._id.toString();
        return {
            ...r,
            history: logsByReportId.get(key) ?? [],
        };
    });
}

export const createReport = async (data, actingUser) => {
    const { associationId, ...reportData } = data;
    const role = actingUser?.role;

    // far always reports under their own association; aew must supply one.
    const resolvedAssociationId =
        role === "far"
            ? actingUser.association
                ? String(actingUser.association)
                : undefined
            : associationId;

    const EntityModel = ENTITY_MODELS[reportData.entityType];
    const entityExists = await EntityModel.countDocuments({
        _id: { $in: reportData.itemIds },
        deletedAt: null,
    });
    if (entityExists !== reportData.itemIds.length) {
        const error = new Error(`One or more selected ${reportData.entityType} items were not found`);
        error.statusCode = 404;
        throw error;
    }

    if (reportData.entityType === "farm") {
        const farmExists = await Farm.exists({ _id: reportData.parentId, deletedAt: null });
        if (!farmExists) {
            const error = new Error("Selected farm was not found");
            error.statusCode = 404;
            throw error;
        }
    }

    // Single-stage approval depending on who submitted — far's reports
    // stop at aew, aew's reports go to coordinator. Never both.
    const initialApprovalStatus =
        role === "far"
            ? { aew: { status: "pending" } }
            : { coordinator: { status: "pending" } };

    const report = await Report.create({
        ...reportData,
        association: resolvedAssociationId || undefined,
        approvalStatus: initialApprovalStatus,
    });

    const association = report.association
        ? await Association.findById(report.association).select("name")
        : null;
    const submitterLabel = association?.name ?? "An unaffiliated user";

    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `${submitterLabel} submitted a report "${report.title}" for ${humanize(report.entityType)}.`,
    });

    return report;
};

export const updateReport = async (id, data) => {
    const { associationId, ...reportData } = data;
    if (associationId !== undefined) {
        reportData.association = associationId;
    }

    const report = await Report.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: reportData },
        { new: true, runValidators: true }
    );

    if (!report) {
        const notFoundError = new Error("Report not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return report;
};

export const updateReportApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;

    if (!STAGE_ROLES.includes(role)) {
        const error = new Error("Only aew or coordinator users can review reports");
        error.statusCode = 403;
        throw error;
    }

    const report = await Report.findOne({ _id: id, deletedAt: null });

    if (!report) {
        const notFoundError = new Error("Report not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const currentStageEntry = report.approvalStatus?.[role];

    if (!currentStageEntry) {
        const error = new Error("This report is not currently awaiting your review");
        error.statusCode = 403;
        throw error;
    }

    if (currentStageEntry.status !== "pending") {
        const error = new Error("This report has already been reviewed");
        error.statusCode = 409;
        throw error;
    }

    report.approvalStatus[role] = {
        status,
        approvedBy: actingUser._id,
        approvedAt: new Date(),
        remarks: remarks || "",
    };

    const stageLabel = humanize(role);
    const decisionVerb = status === "approved" ? "approved" : "denied";
    const remarksSuffix = remarks ? ` Remarks: "${remarks}"` : "";

    // Single decision, full stop — aew approving a far report and
    // coordinator approving an aew report both terminate here. No
    // chaining to a next stage (unlike the multi-stage request flow).
    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `${stageLabel} has ${decisionVerb} the report "${report.title}".${remarksSuffix}`,
    });

    await report.save();
    return report;
};

export const deleteReport = async (id) => {
    const report = await Report.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!report) {
        const notFoundError = new Error("Report not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `Report "${report.title}" has been deleted.`,
    });

    return report;
};

function buildOverallStatusFilter(status) {
    const DENIED_AT_ANY_STAGE = [
        { "approvalStatus.aew.status": "denied" },
        { "approvalStatus.coordinator.status": "denied" },
    ];
    const APPROVED_AT_ANY_STAGE = [
        { "approvalStatus.aew.status": "approved" },
        { "approvalStatus.coordinator.status": "approved" },
    ];

    if (status === "denied") return { $or: DENIED_AT_ANY_STAGE };
    if (status === "approved") return { $or: APPROVED_AT_ANY_STAGE };
    return { $nor: [...DENIED_AT_ANY_STAGE, ...APPROVED_AT_ANY_STAGE] };
}

// stage means "who submitted it", not "who reviews it":
//   - "far" -> reports submitted by a far user (only ever get an aew subdoc)
//   - "aew" -> reports submitted by an aew user (only ever get a
//              coordinator subdoc)
// far's own view is also scoped by association (there's exactly one far
// per association, so association + submittedByRole=far pins it down
// even though an aew report in that same association shares the
// association field). aew and coordinator are never association-scoped
// — they operate across every association (see scopeReportsByRole).
function buildSubmittedByRoleFilter(stage) {
    if (stage === "far") {
        return { "approvalStatus.aew": { $exists: true } };
    }
    if (stage === "aew") {
        return { "approvalStatus.coordinator": { $exists: true } };
    }
    return {};
}

export const getReports = async ({
    status,
    severity,
    entityType,
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
    if (entityType) filter.entityType = entityType;
    if (associationId) filter.association = associationId;
    if (search) filter.title = new RegExp(escapeRegex(search), "i");

    if (stage) Object.assign(filter, buildSubmittedByRoleFilter(stage));
    if (status) Object.assign(filter, buildOverallStatusFilter(status));

    if (all) {
        const reports = await Report.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
        const withEntities = await populateEntities(reports);
        return {
            reports: await attachHistory(withEntities, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        Report.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Report.countDocuments(filter),
    ]);

    const withEntities = await populateEntities(reports);

    return {
        reports: await attachHistory(withEntities, associationId),
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