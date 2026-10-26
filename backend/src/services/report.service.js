import Report from "../models/report.model.js";
import { randomUUID } from "node:crypto";
import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";
import { getReportItems, highestSeverity, normalizeReportItems } from "../utils/reportItems.js";
import { createReportSchema } from "../schemas/report.schema.js";
import { CROP_TYPE_POPULATE, EQUIPMENT_TYPE_POPULATE, ANIMAL_POPULATE } from "../utils/maintenanceLinks.js";
import { hasFarmReportMeasurements, isFarmReportApproved } from "../utils/farmReportTotals.js";

const STAGE_ROLES = ["aew", "coordinator"];

function fail(message, statusCode = 409) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
}

async function withReportLock(id, action) {
    const token = randomUUID();
    const report = await Report.findOneAndUpdate(
        { _id: id, deletedAt: null, operationLock: null },
        { $set: { operationLock: token } },
        { returnDocument: "after", timestamps: false },
    );
    if (!report) {
        if (!await Report.exists({ _id: id, deletedAt: null })) fail("Report not found", 404);
        fail("This report is being updated. Please try again.");
    }
    try {
        return await action(report);
    } finally {
        await Report.updateOne({ _id: id, operationLock: token }, { $unset: { operationLock: "" } }, { timestamps: false });
    }
}

async function assertCanManageFarmReport(report, actingUser) {
    if (report.entityType !== "farm") return;
    if (!["far", "aew"].includes(actingUser?.role)) fail("Only FAR or AEW users can manage crop reports", 403);
    if (actingUser.role === "far") {
        const associationId = await resolveFarAssociationId(actingUser._id);
        if (!associationId || String(report.association) !== associationId) fail("You may only manage your association's crop reports", 403);
    }
}

async function validateFarmReport(data, associationId) {
    const farm = await Farm.findOne({ _id: data.parentId, deletedAt: null }).select("association crops.crop").lean();
    if (!farm) fail("Selected farm was not found", 404);
    if (!associationId || String(farm.association) !== String(associationId)) fail("The farm must belong to the report's association", 403);
    const farmCrops = new Set(farm.crops.map((entry) => String(entry.crop)));
    if (data.itemIds.some((id) => !farmCrops.has(String(id)))) fail("Selected crops must belong to the selected farm", 400);
    const crops = await Crop.find({ _id: { $in: data.itemIds }, deletedAt: null }).select("association").lean();
    if (crops.length !== data.itemIds.length || crops.some((crop) => String(crop.association) !== String(associationId))) fail("Selected crops must belong to the report's association", 400);
}

// entityType here describes what's being reported ON, not who submitted it.
// "farm" reports are actually about specific crops within a farm (parentId),
// so itemIds for that type resolve against Crop, not Farm.
const ENTITY_MODELS = {
    farm: Crop,
    livestock: Livestock,
    equipment: Equipment,
};

const ENTITY_SELECT = {
    farm: "name cropType quantity",
    livestock: "propertyNumber animal animalType breed color",
    equipment: "propertyNumber name equipmentType",
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
            ? Crop.find({ _id: { $in: [...idsByType.farm] } }).select(ENTITY_SELECT.farm).populate(CROP_TYPE_POPULATE).lean()
            : [],
        idsByType.livestock.size
            ? Livestock.find({ _id: { $in: [...idsByType.livestock] } }).select(ENTITY_SELECT.livestock).populate(ANIMAL_POPULATE).lean()
            : [],
        idsByType.equipment.size
            ? Equipment.find({ _id: { $in: [...idsByType.equipment] } }).select(ENTITY_SELECT.equipment).populate(EQUIPMENT_TYPE_POPULATE).lean()
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
        items: r.entityType === "farm"
            ? r.itemIds.map((id) => entityMap.get(String(id))).filter(Boolean)
            : getReportItems(r).map((entry) => ({
                ...entityMap.get(String(entry.item)),
                item: entityMap.get(String(entry.item)) ?? entry.item,
                itemId: String(entry.item),
                condition: entry.condition,
                severity: entry.severity,
            })),
        severity: r.entityType === "farm" ? r.severity : highestSeverity(getReportItems(r)),
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

const resolveFarAssociationId = async (userId) => {
    const association = await Association.findOne({
        user: userId,
        deletedAt: null,
    }).select("_id");
    return association ? String(association._id) : undefined;
};

// Resolves the association's assigned user so approval/denial emails have
// somewhere to go. Returns null (rather than throwing) when there's no
// association or no user email on file, so callers can just skip sending.
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

function mapItemsForEmail(entityType, docs, report) {
    if (entityType === "farm") {
        return docs.map((doc) => ({
            label: doc.name,
            detail: doc.quantity != null ? `Qty: ${doc.quantity}` : "",
        }));
    }
    return docs.map((doc) => ({
        label: entityType === "livestock" ? doc.animal : doc.name,
        detail: doc.propertyNumber,
        condition: getReportItems(report).find((entry) => String(entry.item) === String(doc._id))?.condition,
        severity: getReportItems(report).find((entry) => String(entry.item) === String(doc._id))?.severity,
    }));
}

async function sendReportApprovedEmail(report, role) {
    const recipient = await getAssociationRecipient(report.association);
    if (!recipient) return;

    const EntityModel = ENTITY_MODELS[report.entityType];
    const itemDocs = await EntityModel.find({
        _id: { $in: report.itemIds },
    })
        .select(ENTITY_SELECT[report.entityType])
        .lean();

    await emailQueue.add(EMAIL_JOBS.REPORT_APPROVED, {
        type: EMAIL_JOBS.REPORT_APPROVED,
        data: {
            to: recipient.email,
            name: recipient.name,
            reportTitle: report.title,
            entityType: report.entityType,
            stage: humanize(role),
            items: mapItemsForEmail(report.entityType, itemDocs, report),
        },
    });
}

async function sendReportRejectedEmail(report, role, remarks) {
    const recipient = await getAssociationRecipient(report.association);
    if (!recipient) return;
    const docs = await ENTITY_MODELS[report.entityType].find({ _id: { $in: report.itemIds } }).select(ENTITY_SELECT[report.entityType]).lean();

    await emailQueue.add(EMAIL_JOBS.REPORT_REJECTED, {
        type: EMAIL_JOBS.REPORT_REJECTED,
        data: {
            to: recipient.email,
            name: recipient.name,
            reportTitle: report.title,
            stage: humanize(role),
            remarks: remarks || "",
            items: mapItemsForEmail(report.entityType, docs, report),
        },
    });
}

export const createReport = async (data, actingUser) => {
    const { associationId, ...reportData } = normalizeReportItems(data);
    const role = actingUser?.role;
    if (!["far", "aew"].includes(role)) fail("Only FAR or AEW users can submit reports", 403);

    const resolvedAssociationId =
        role === "far"
            ? await resolveFarAssociationId(actingUser._id)
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
        await validateFarmReport(reportData, resolvedAssociationId);
    }

    // Every crop report starts at AEW; other entity types retain their workflow.
    const initialApprovalStatus =
        reportData.entityType === "farm" || role === "far"
            ? { aew: { status: "pending" } }
            : { coordinator: { status: "pending" } };

    const report = await Report.create({
        ...reportData,
        association: resolvedAssociationId || undefined,
        submittedByRole: role,
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

export const updateReport = async (id, data, actingUser) => withReportLock(id, async (report) => {
    await assertCanManageFarmReport(report, actingUser);
    if ((report.entityType === "farm" || data.entityType === "farm") && data.entityType && data.entityType !== report.entityType) fail("A crop report's type cannot be changed", 400);
    if (report.entityType !== "farm" && STAGE_ROLES.some((stage) => ["approved", "denied"].includes(report.approvalStatus[stage]?.status))) {
        const error = new Error("Reviewed reports cannot be edited");
        error.statusCode = 409;
        throw error;
    }
    const merged = {
        ...report.toObject(),
        parentId: report.parentId ? String(report.parentId) : undefined,
        itemIds: report.itemIds.map(String),
        cropEntries: report.cropEntries?.map((entry) => ({ crop: String(entry.crop), quantity: entry.quantity, yieldKg: entry.yieldKg })),
        reportedAt: report.reportedAt?.toISOString(),
        items: (data.entityType ?? report.entityType) === "farm" ? undefined : getReportItems(report).map((entry) => ({ itemId: String(entry.item), condition: entry.condition, severity: entry.severity })),
        ...data,
    };
    const parsed = createReportSchema.safeParse(merged);
    if (!parsed.success) {
        const error = new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
        error.statusCode = 400;
        throw error;
    }
    const { associationId, ...reportData } = normalizeReportItems(parsed.data);
    const existing = await ENTITY_MODELS[reportData.entityType].countDocuments({ _id: { $in: reportData.itemIds }, deletedAt: null });
    if (existing !== reportData.itemIds.length) {
        const error = new Error("One or more selected items were not found");
        error.statusCode = 404;
        throw error;
    }
    if (report.entityType === "farm") {
        const association = actingUser.role === "far" ? report.association : associationId ?? report.association;
        await validateFarmReport(reportData, association);
        reportData.association = association;
    }
    report.set(reportData);
    if (associationId !== undefined && actingUser?.role !== "far") report.association = associationId;
    if (report.entityType === "farm") report.approvalStatus = { aew: { status: "pending" } };
    await report.save();
    if (report.entityType === "farm") await createLog({
        entityType: "report", entityId: report._id, association: report.association,
        message: `Crop report "${report.title}" was edited. Previous approvals were invalidated; AEW and Coordinator approval are required again.`,
    });
    return report;
});

export const updateReportApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;
    if (!STAGE_ROLES.includes(role)) fail("Only aew or coordinator users can review reports", 403);
    if (!["approved", "denied"].includes(status)) fail("Invalid review decision", 400);

    return withReportLock(id, async (report) => {
        const currentStageEntry = report.approvalStatus?.[role];
        if (!currentStageEntry) fail("This report is not currently awaiting your review", 403);
        const withdrawingApproval = report.entityType === "farm" && role === "coordinator"
            && status === "denied" && isFarmReportApproved(report);
        if (currentStageEntry.status !== "pending" && !withdrawingApproval) fail("This report has already been reviewed");

        if (report.entityType === "farm") {
            if (STAGE_ROLES.some((stage) => report.approvalStatus[stage]?.status === "denied")) fail("A denied report must be edited and submitted for review again");
            if (role === "coordinator" && report.approvalStatus.aew?.status !== "approved") fail("AEW must approve the crop report first", 403);
            if (role === "aew" && report.approvalStatus.coordinator?.status === "approved") fail("Coordinator has already acted");
            if (status === "denied" && (!remarks || remarks.trim().length < 5)) fail("Denial remarks must contain at least 5 characters", 400);
            if (status === "approved" && !hasFarmReportMeasurements(report)) fail("Correct this legacy crop report's date and measurements before approval", 400);
        }

        report.approvalStatus[role] = { status, approvedBy: actingUser._id, approvedAt: new Date(), remarks: remarks || "" };
        if (report.entityType === "farm" && role === "aew") {
            report.approvalStatus.coordinator = status === "approved" ? { status: "pending" } : undefined;
        }

        if (status === "approved" && report.entityType !== "farm") {
            for (const entry of getReportItems(report)) {
                await ENTITY_MODELS[report.entityType].updateOne(
                    { _id: entry.item, deletedAt: null },
                    {
                        $set: {
                            condition: entry.condition,
                            ...(report.entityType === "livestock" ? { deceasedAt: entry.condition === "deceased" ? new Date() : null } : {}),
                        },
                        ...(report.entityType === "livestock" ? { $inc: { __v: 1 } } : {}),
                    },
                    { runValidators: true },
                );
            }
        }

        // Missing legacy measurements must block approval, not rejection.
        const rejectingLegacy = report.entityType === "farm" && status === "denied" && !hasFarmReportMeasurements(report);
        await report.save({ validateBeforeSave: !rejectingLegacy });
        await createLog({
            entityType: "report", entityId: report._id, association: report.association,
            message: `${humanize(role)} has ${status} the report "${report.title}".${remarks ? ` Remarks: "${remarks}"` : ""}`,
        });
        // AEW approval is intermediate for crop reports, not a final outcome.
        if (status === "approved" && (report.entityType !== "farm" || role === "coordinator")) await sendReportApprovedEmail(report, role);
        else if (status === "denied") await sendReportRejectedEmail(report, role, remarks);
        return report;
    });
};

export const deleteReport = async (id, actingUser) => withReportLock(id, async (report) => {
    await assertCanManageFarmReport(report, actingUser);
    // Legacy reports without measurements can still be removed.
    report.deletedAt = new Date();
    await Report.updateOne({ _id: report._id }, { $set: { deletedAt: report.deletedAt } });

    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `Report "${report.title}" has been deleted.`,
    });

    return report;
});

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
    const FINAL_APPROVAL = [
        { entityType: "farm", "approvalStatus.aew.status": "approved", "approvalStatus.coordinator.status": "approved" },
        { entityType: { $ne: "farm" }, $or: APPROVED_AT_ANY_STAGE, $nor: DENIED_AT_ANY_STAGE },
    ];
    if (status === "approved") return { $or: FINAL_APPROVAL };
    return { $nor: [...DENIED_AT_ANY_STAGE, ...FINAL_APPROVAL] };
}

// Retain submitter filters, with a dedicated Coordinator review queue.
// Legacy single-stage documents use their old subdocument shape as a fallback.
function buildSubmittedByRoleFilter(stage) {
    if (stage === "coordinator") return { $or: [
        { entityType: "farm", "approvalStatus.aew.status": "approved" },
        { entityType: { $ne: "farm" }, "approvalStatus.coordinator": { $exists: true } },
    ] };
    if (stage === "far") {
        return { $or: [{ submittedByRole: "far" }, { submittedByRole: { $exists: false }, "approvalStatus.aew": { $exists: true } }] };
    }
    if (stage === "aew") {
        return { $or: [{ submittedByRole: "aew" }, { submittedByRole: { $exists: false }, "approvalStatus.coordinator": { $exists: true } }] };
    }
    return {};
}

export const getReports = async ({
    date,
    timezoneOffset = 0,
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

    if (date) {
        const start = new Date(new Date(`${date}T00:00:00Z`).getTime() + timezoneOffset * 60000);
        filter.createdAt = { $gte: start, $lt: new Date(start.getTime() + 86400000) };
    }

    if (severity) filter.severity = severity;
    if (entityType) filter.entityType = entityType;
    if (associationId) filter.association = associationId;
    if (search) filter.title = new RegExp(escapeRegex(search), "i");

    if (stage || status) filter.$and = [
        ...(stage ? [buildSubmittedByRoleFilter(stage)] : []),
        ...(status ? [buildOverallStatusFilter(status)] : []),
    ];

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
