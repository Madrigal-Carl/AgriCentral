import Report from "../models/report.model.js";
import { randomUUID } from "node:crypto";
import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Farmer from "../models/farmer.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";
import { cropEntryStage, getCropReportEntries, getReportItems, highestPriority, isLegacyCropReport, livestockReportKind, normalizeReportItems } from "../utils/reportItems.js";
import { CROP_STAGE_LABELS } from "../utils/cropStages.js";
import { reproductiveSubStagesFor, validateStageData } from "../utils/cropStageFields.js";
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

const dayOf = (date) => new Date(date).toISOString().slice(0, 10);

// Livestock and equipment rules that need the records themselves:
// - offspring: the mother is a female, living animal;
// - condition kind: a date of death is not before the animal's birth date;
// - equipment in use: the farmer belongs to the report's association.
async function validateItemReport(data, associationId) {
    if (data.entityType === "livestock" && data.reportKind === "offspring") {
        const mother = await Livestock.findOne({ _id: data.offspring?.mother, deletedAt: null }).select("gender condition birthDate").lean();
        if (!mother) fail("The selected mother was not found", 404);
        if (mother.gender !== "female") fail("The mother must be a female animal", 400);
        if (mother.condition === "deceased") fail("The mother cannot be a deceased animal", 400);
    }
    if (data.entityType === "livestock" && data.reportKind === "condition") {
        const deceased = data.items.filter((entry) => entry.deceased?.dateOfDeath);
        const animals = deceased.length
            ? await Livestock.find({ _id: { $in: deceased.map((entry) => entry.item) } }).select("propertyNumber birthDate").lean()
            : [];
        for (const entry of deceased) {
            const animal = animals.find((doc) => String(doc._id) === String(entry.item));
            if (animal?.birthDate && dayOf(entry.deceased.dateOfDeath) < dayOf(animal.birthDate)) {
                fail(`Date of death for ${animal.propertyNumber} cannot be before its birth date (${dayOf(animal.birthDate)})`, 400);
            }
        }
    }
    if (data.entityType === "livestock" && data.reportKind === "redispersal") {
        const farmerIds = [...new Set(data.items.flatMap((entry) => [entry.fromFarmer, entry.toFarmer]).filter(Boolean).map(String))];
        const found = farmerIds.length
            ? await Farmer.countDocuments({ _id: { $in: farmerIds }, association: associationId, deletedAt: null })
            : 0;
        if (found !== farmerIds.length) fail("Both farmers in a redispersal must belong to the report's association", 400);
    }
    if (data.entityType === "equipment") {
        const farmerIds = [...new Set(data.items.filter((entry) => entry.usageStatus === "in_use").map((entry) => String(entry.farmer)))];
        if (farmerIds.length) {
            const found = await Farmer.countDocuments({ _id: { $in: farmerIds }, association: associationId, deletedAt: null });
            if (found !== farmerIds.length) fail("The farmer using the equipment must belong to the report's association", 400);
        }
    }
}

// Farm -> farmer -> crop: the farmer must be assigned to the farm, and the
// crop must be on that farm and assigned to that farmer.
async function validateFarmReport(data, associationId) {
    const farm = await Farm.findOne({ _id: data.parentId, deletedAt: null }).select("association crops.crop assignedFarmers.farmer").lean();
    if (!farm) fail("Selected farm was not found", 404);
    if (!associationId || String(farm.association) !== String(associationId)) fail("The farm must belong to the report's association", 403);
    if (data.itemIds.length !== 1) fail("A crop report covers exactly one crop", 400);
    if (!farm.assignedFarmers.some((entry) => String(entry.farmer) === String(data.farmer))) fail("The farmer must be assigned to the selected farm", 400);
    const farmCrops = new Set(farm.crops.map((entry) => String(entry.crop)));
    if (data.itemIds.some((id) => !farmCrops.has(String(id)))) fail("The crop must belong to the selected farm", 400);
    const crops = await Crop.find({ _id: { $in: data.itemIds }, deletedAt: null }).select("association ownership assignedFarmer cropType").populate(CROP_TYPE_POPULATE).lean();
    // Farmer-owned crops have no association; belonging to the farm is enough.
    if (crops.length !== data.itemIds.length || crops.some((crop) => crop.ownership !== "farmer" && String(crop.association) !== String(associationId))) fail("The crop must belong to the report's association", 400);
    if (crops.some((crop) => String(crop.assignedFarmer) !== String(data.farmer))) fail("The crop must belong to the selected farmer", 400);
    for (const entry of data.cropEntries) {
        const crop = crops.find((item) => String(item._id) === String(entry.crop));
        validateCropStageEntry(entry, crop);
    }
}

// Stage fields (the same rules as the schema and model), plus the rules that
// need the crop: seed ownership follows the crop and the reproductive
// sub-stage must come from the crop type's list. The seed quantity is only
// reported; it is not checked against or taken from the crop's stock.
function validateCropStageEntry(entry, crop) {
    if (!entry.stage) fail("Select the crop's stage", 400);
    const [issue] = validateStageData(entry.stage, entry.stageData);
    if (issue) fail(issue.message, 400);
    const data = entry.stageData;
    if (entry.stage === "newly_planted") {
        const ownership = crop.ownership ?? "government";
        if (data.seedOwnership !== ownership) fail(`Seed ownership must be ${ownership} for this crop`, 400);
    }
    if (entry.stage === "reproductive") {
        const allowed = reproductiveSubStagesFor(crop.cropType?.name);
        if (!allowed.includes(data.subStage)) fail(`Sub-stage must be one of: ${allowed.join(", ")}`, 400);
    }
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
    farm: "name cropType quantity ownership",
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

    // Crop report farmers, the farmers using reported equipment, and the
    // farmers on both ends of a livestock redispersal.
    const farmerIds = [...new Set([
        ...reports.filter((r) => r.entityType === "farm" && r.farmer).map((r) => String(r.farmer)),
        ...reports.filter((r) => r.entityType === "equipment").flatMap((r) => (r.items ?? []).filter((entry) => entry.farmer).map((entry) => String(entry.farmer))),
        ...reports.filter((r) => r.entityType === "livestock").flatMap((r) => (r.items ?? []).flatMap((entry) => [entry.fromFarmer, entry.toFarmer]).filter(Boolean).map(String)),
    ])];
    const farmerRef = (id) => (id ? farmerMap.get(String(id)) ?? { _id: id, fullName: null } : undefined);

    const [cropDocs, livestockDocs, equipmentDocs, farmDocs, farmerDocs] = await Promise.all([
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
        farmerIds.length
            ? Farmer.find({ _id: { $in: farmerIds } }).select("firstName lastName")
            : [],
    ]);
    const farmerMap = new Map(farmerDocs.map((f) => [String(f._id), { _id: f._id, fullName: f.getFullName() }]));

    const entityMap = new Map();
    for (const doc of [...cropDocs, ...livestockDocs, ...equipmentDocs]) {
        entityMap.set(String(doc._id), doc);
    }
    const farmMap = new Map(farmDocs.map((f) => [String(f._id), f]));

    return reports.map((r) => ({
        ...r,
        items: getReportItems(r).map((entry) => ({
            ...entityMap.get(String(entry.item)),
            item: entityMap.get(String(entry.item)) ?? entry.item,
            itemId: String(entry.item),
            condition: r.entityType === "farm" ? cropEntryStage(entry, r) : entry.condition,
            priority: entry.priority,
            // Current crop entries: stage + stage-specific fields.
            stage: entry.stage,
            stageData: entry.stageData,
            // Legacy crop entries.
            reportedQuantity: entry.quantity,
            yieldKg: entry.yieldKg,
            // Livestock condition reports: cause and date of death.
            deceased: entry.deceased,
            // Equipment: reported usage and the farmer using it.
            usageStatus: entry.usageStatus,
            usedBy: entry.farmer ? farmerMap.get(String(entry.farmer)) ?? { _id: entry.farmer, fullName: null } : undefined,
            // Livestock redispersal: from one farmer to another.
            fromFarmer: farmerRef(entry.fromFarmer),
            toFarmer: farmerRef(entry.toFarmer),
        })),
        reportKind: livestockReportKind(r),
        priority: highestPriority(getReportItems(r)),
        parent: r.parentId ? farmMap.get(String(r.parentId)) ?? null : null,
        farmer: r.farmer ? farmerMap.get(String(r.farmer)) ?? { _id: r.farmer, fullName: null } : null,
        isLegacy: isLegacyCropReport(r),
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

// One-line summary of a crop entry's main measurement for emails.
function cropEmailDetail(entry) {
    const data = entry?.stageData;
    if (entry?.stage === "newly_planted") return `Seeds: ${data.seedQuantity} · ${data.areaPlantedHa} ha`;
    if (entry?.stage === "harvested") return `Production: ${data.totalProductionKg} kg · ${data.areaHarvestedHa} ha`;
    if (entry?.stage === "damaged") return `Area affected: ${data.areaAffectedHa} ha`;
    if (entry?.stage) return `Area: ${data.areaHa} ha`;
    // Legacy entries.
    if (cropEntryStage(entry) === "harvested") return `Qty: ${entry.yieldKg} kg`;
    return entry?.quantity != null ? `Qty: ${entry.quantity}` : "";
}

function mapItemsForEmail(entityType, docs, report) {
    if (entityType === "farm") {
        return docs.map((doc) => {
            const entry = getCropReportEntries(report).find((entry) => String(entry.crop) === String(doc._id));
            return {
                label: doc.name,
                detail: cropEmailDetail(entry),
                condition: CROP_STAGE_LABELS[cropEntryStage(entry, report)] ?? entry?.condition,
                priority: entry?.priority,
            };
        });
    }
    if (livestockReportKind(report) === "offspring") {
        return docs.map((doc) => ({
            label: doc.animal,
            detail: `${doc.propertyNumber} · Mother of ${report.offspring?.count ?? 0} new offspring`,
            condition: "Offspring",
            priority: report.priority,
        }));
    }
    return docs.map((doc) => ({
        label: entityType === "livestock" ? doc.animal : doc.name,
        detail: doc.propertyNumber,
        condition: getReportItems(report).find((entry) => String(entry.item) === String(doc._id))?.condition,
        priority: getReportItems(report).find((entry) => String(entry.item) === String(doc._id))?.priority,
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
    } else {
        await validateItemReport(reportData, resolvedAssociationId);
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
    if (isLegacyCropReport(report)) fail("Legacy crop reports can be viewed and reviewed but not edited", 409);
    if ((report.entityType === "farm" || data.entityType === "farm") && data.entityType && data.entityType !== report.entityType) fail("A crop report's type cannot be changed", 400);
    if (report.entityType !== "farm" && STAGE_ROLES.some((stage) => ["approved", "denied"].includes(report.approvalStatus[stage]?.status))) {
        const error = new Error("Reviewed reports cannot be edited");
        error.statusCode = 409;
        throw error;
    }
    const merged = {
        ...report.toObject(),
        parentId: report.parentId ? String(report.parentId) : undefined,
        farmer: report.farmer ? String(report.farmer) : undefined,
        itemIds: report.itemIds.map(String),
        // Legacy reports are never edited, so entries here carry a stage.
        cropEntries: getCropReportEntries(report).map((entry) => ({ ...entry, crop: String(entry.crop) })),
        reportedAt: report.reportedAt?.toISOString(),
        items: (data.entityType ?? report.entityType) === "farm" || livestockReportKind(report) === "offspring" ? undefined : getReportItems(report).map((entry) => ({
            itemId: String(entry.item),
            condition: entry.condition,
            priority: entry.priority,
            ...(entry.deceased?.cause ? { deceased: { cause: entry.deceased.cause, dateOfDeath: entry.deceased.dateOfDeath } } : {}),
            ...(entry.usageStatus ? { usageStatus: entry.usageStatus } : {}),
            ...(entry.farmer ? { farmer: String(entry.farmer) } : {}),
            ...(entry.fromFarmer ? { fromFarmer: String(entry.fromFarmer) } : {}),
            ...(entry.toFarmer ? { toFarmer: String(entry.toFarmer) } : {}),
        })),
        offspring: report.offspring?.mother ? { ...report.toObject().offspring, mother: String(report.offspring.mother) } : undefined,
        ...data,
    };
    // Kind-specific fields follow the resulting type and kind.
    if (merged.entityType !== "livestock") delete merged.reportKind;
    if (merged.entityType !== "livestock" || (merged.reportKind ?? "condition") !== "offspring") delete merged.offspring;
    else if (!data.items) delete merged.items;
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
    } else {
        await validateItemReport(reportData, actingUser.role === "far" ? report.association : associationId ?? report.association);
    }
    report.set(reportData);
    if (associationId !== undefined && actingUser?.role !== "far") report.association = associationId;
    if (report.entityType === "farm") report.approvalStatus = { aew: { status: "pending" } };
    await report.validate();
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

        // Approval updates records only for equipment (condition only; usage
        // status and farmer are reporting only) and condition-kind livestock.
        // Offspring (added manually by the coordinator) and redispersal
        // reports change no livestock record.
        const updatesRecords = report.entityType === "equipment" || livestockReportKind(report) === "condition";
        if (status === "approved" && updatesRecords) {
            for (const entry of getReportItems(report)) {
                await ENTITY_MODELS[report.entityType].updateOne(
                    { _id: entry.item, deletedAt: null },
                    {
                        $set: {
                            condition: entry.condition,
                            // The reported date of death (older reports without one: now).
                            ...(report.entityType === "livestock" ? { deceasedAt: entry.condition === "deceased" ? entry.deceased?.dateOfDeath ?? new Date() : null } : {}),
                        },
                        ...(report.entityType === "livestock" ? { $inc: { __v: 1 } } : {}),
                    },
                    { runValidators: true },
                );
            }
        }

        // Missing legacy measurements must block approval, not rejection.
        const rejectingLegacy = report.entityType === "farm" && status === "denied" && !hasFarmReportMeasurements(report);
        await report.validate().catch((error) => { if (!rejectingLegacy) throw error; });

        // Crop reports only record what was reported: approving or
        // withdrawing one never changes the farm's quantities or crop stock.
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
    id,
    date,
    timezoneOffset = 0,
    status,
    priority,
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

    if (id) filter._id = id;
    if (priority) filter.priority = priority;
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
