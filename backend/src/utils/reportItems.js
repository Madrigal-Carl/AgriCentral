import { CROP_STAGES, LEGACY_CROP_STAGE_KEYS, toCropStage } from "./cropStages.js";
import { normalizeStageData, STAGE_MAIN_DATE } from "./cropStageFields.js";

export const REPORT_CONDITIONS = {
    farm: CROP_STAGES,
    equipment: ["excellent", "good", "maintenance", "damaged", "unusable"],
    livestock: ["healthy", "pregnant", "sick", "injured", "deceased"],
};

// Livestock report kinds. Only "condition" reports update livestock records
// on approval; "offspring" (the coordinator adds the newborns manually) and
// "redispersal" are reports only. Stored reports without a kind are
// condition reports.
export const LIVESTOCK_REPORT_KINDS = ["condition", "offspring", "redispersal"];
export const DEFAULT_LIVESTOCK_REPORT_KIND = "condition";
export const livestockReportKind = (report) =>
    report?.entityType === "livestock" ? report.reportKind ?? DEFAULT_LIVESTOCK_REPORT_KIND : undefined;

// Deceased details on condition-kind livestock items.
export const DECEASED_CAUSES = ["disease_asf", "accidental_injury", "birth_complications", "unknown"];

// Equipment report items: how the equipment is being used (reporting only;
// the equipment's own assigned/available status is never changed by it).
export const EQUIPMENT_USAGE_STATUSES = ["in_use", "idle"];
export const DEFAULT_EQUIPMENT_USAGE_STATUS = "idle";

// Crop reports are one crop per report with a farmer. Reports stored before
// that rule (no farmer, or several crops) are legacy: still viewable and
// reviewable, never edited or converted.
// Entries without a stage (condition + quantity, stored before stage fields)
// are legacy too.
export function isLegacyCropReport(report) {
    if (report?.entityType !== "farm") return false;
    const entries = Math.max(report.cropEntries?.length ?? 0, report.itemIds?.length ?? 0);
    return !report.farmer || entries > 1 || !report.cropEntries?.every((entry) => entry.stage);
}

// Stage of a crop entry in the current vocabulary (legacy entries read
// their condition through the mapper).
export const cropEntryStage = (entry, report) => entry?.stage ?? toCropStage(entry?.condition ?? report?.condition);

const plain = (value) => (typeof value?.toObject === "function" ? value.toObject() : value);

// Every crop report entry, read through the stored fallbacks. New reports
// hold exactly one entry; legacy reports may hold several.
export function getCropReportEntries(report) {
    return (report.cropEntries ?? []).map((entry) => (entry.stage
        // Current shape: stage + stage-specific fields.
        ? {
            crop: entry.crop,
            stage: entry.stage,
            stageData: plain(entry.stageData) ?? {},
            priority: entry.priority ?? report.priority ?? "medium",
        }
        // Legacy shape: condition + quantity / yieldKg.
        : {
            crop: entry.crop,
            condition: entry.condition ?? report.condition,
            priority: entry.priority ?? report.priority ?? "medium",
            quantity: entry.quantity,
            yieldKg: entry.yieldKg,
        }));
}

export function getReportItems(report) {
    if (report.entityType === "farm" && report.cropEntries?.length) {
        return getCropReportEntries(report).map(({ crop, ...entry }) => ({ item: crop, ...entry }));
    }
    if (report.entityType !== "farm" && report.items?.length) return report.items;
    return (report.itemIds ?? []).map((item) => ({
        item, condition: report.condition, priority: report.priority ?? "medium",
    }));
}

export function highestPriority(items) {
    const order = ["low", "medium", "high", "critical"];
    return order[Math.max(0, ...items.map((item) => order.indexOf(item.priority ?? "medium")))];
}

export function normalizeReportItems(data) {
    if (data.entityType === "farm") {
        // One crop per report: itemIds mirrors the single crop entry so
        // existing readers of itemIds keep working. Stage data keeps only
        // its stage's fields, and reportedAt follows the stage's main date.
        const cropEntries = getCropReportEntries(data).map((entry) => (entry.stage
            ? { ...entry, stageData: normalizeStageData(entry.stage, entry.stageData) }
            : entry));
        const [first] = cropEntries;
        const mainDate = first?.stage ? first.stageData[STAGE_MAIN_DATE[first.stage]] : undefined;
        return {
            ...data, items: [], cropEntries, itemIds: cropEntries.map((entry) => entry.crop),
            priority: highestPriority(cropEntries), condition: undefined,
            ...(mainDate ? { reportedAt: mainDate } : {}),
        };
    }
    const reportKind = livestockReportKind(data);
    const common = { condition: undefined, parentId: null, farmer: undefined, cropEntries: [], reportedAt: undefined, reportKind };
    // Offspring: one mother, no item conditions; priority stays the default.
    if (reportKind === "offspring") {
        const offspring = data.offspring && {
            mother: data.offspring.mother,
            count: data.offspring.count,
            birthDate: data.offspring.birthDate,
            ...(data.offspring.notes ? { notes: data.offspring.notes } : {}),
        };
        return { ...data, ...common, offspring, items: [], itemIds: offspring?.mother ? [offspring.mother] : [], priority: "medium" };
    }
    const items = (data.items ?? []).map((entry) => ({
        item: entry.itemId ?? entry.item,
        condition: entry.condition,
        priority: entry.priority ?? "medium",
        // Cause and date of death: condition-kind livestock, deceased items only.
        ...(reportKind === "condition" && entry.condition === "deceased" && entry.deceased
            ? { deceased: { cause: entry.deceased.cause, dateOfDeath: entry.deceased.dateOfDeath } }
            : {}),
        // Equipment usage: a farmer only while in use.
        ...(data.entityType === "equipment"
            ? (() => {
                const usageStatus = entry.usageStatus ?? DEFAULT_EQUIPMENT_USAGE_STATUS;
                return { usageStatus, ...(usageStatus === "in_use" && entry.farmer ? { farmer: entry.farmer } : {}) };
            })()
            : {}),
        // Redispersal: the farmer giving and the farmer receiving the animal.
        ...(reportKind === "redispersal" ? { fromFarmer: entry.fromFarmer, toFarmer: entry.toFarmer } : {}),
    }));
    return { ...data, ...common, offspring: undefined, items, itemIds: items.map((entry) => entry.item), priority: highestPriority(items) };
}

// New writes accept REPORT_CONDITIONS.farm only. Reports stored before the
// stage rename may still hold legacy names, which must keep loading and
// re-validating (approvals re-save); read them through toCropStage.
export const STORED_FARM_REPORT_CONDITIONS = [...CROP_STAGES, ...LEGACY_CROP_STAGE_KEYS];
