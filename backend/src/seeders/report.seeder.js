import Report from "../models/report.model.js";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Crop from "../models/crop.model.js";
import { CROP_TYPE_POPULATE } from "../utils/maintenanceLinks.js";
import { reproductiveSubStagesFor, toProductionKg } from "../utils/cropStageFields.js";
import { REPORT_TITLES } from "./title.seeder.js";

// Every report needs at least one image; seeds use a placeholder.
const PLACEHOLDER_ATTACHMENT = {
    url: "https://placehold.co/800x600.png?text=AgriCentral+report",
    publicId: "seed/report-placeholder",
    resourceType: "image",
};

// Each entry sources its item(s) from an already-seeded collection
// (`farms`, `livestocks`, or `equipments`) by index, so `itemIds` (and
// `parentId` for farm reports) always point at real documents. Crop
// (farm) reports cover one crop — the farm's first crop entry unless
// `cropEntryIndex` says otherwise — reported for that crop's farmer.
const REPORTS_TO_SEED = [
    // Livestock report kinds: a deceased animal (condition), new offspring
    // and a redispersal. Only the condition report changes the animal.
    {
        title: REPORT_TITLES.livestockDeath,
        priority: "critical",
        entityType: "livestock",
        reportKind: "condition",
        condition: "deceased",
        deceased: { cause: "disease_asf", daysAgo: 6 },
        details:
            "The native pig (LVS-004) developed a high fever and skin discoloration and died within days; samples were sent for African Swine Fever testing.",
        source: "livestocks",
        indexes: [3],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.livestockOffspring,
        priority: "medium",
        entityType: "livestock",
        reportKind: "offspring",
        offspring: { count: 1, daysAgo: 12, notes: "Calf is nursing well; both are under observation." },
        details:
            "The female carabao (LVS-007) delivered one calf without complications; the coordinator will register the newborn.",
        source: "livestocks",
        indexes: [6],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.livestockRedispersal,
        priority: "low",
        entityType: "livestock",
        reportKind: "redispersal",
        condition: "healthy",
        details:
            "The cattle (LVS-002) is in good health and ready to be redispersed to the next beneficiary under the dispersal program.",
        source: "livestocks",
        indexes: [1],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.equipmentMalfunction,
        priority: "high",
        entityType: "equipment",
        condition: "damaged",
        // Reported in use by a farmer of the equipment's association.
        usageStatus: "in_use",
        details:
            "The rice thresher (EQP-003) has been producing a grinding noise and stalled midway through threshing during the last harvest. It needs immediate repair before the next cropping season.",
        source: "equipments",
        indexes: [2],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.equipmentDamage,
        priority: "medium",
        entityType: "equipment",
        condition: "damaged",
        details:
            "The grass cutter's blade assembly cracked while clearing overgrowth along the farm access road and is currently unsafe to operate.",
        source: "equipments",
        indexes: [7],
        aewStatus: "approved",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.livestockHealth,
        priority: "high",
        entityType: "livestock",
        condition: "injured",
        details:
            "The carabao (LVS-001) has been limping on its front left leg since last week, likely from stepping on debris while plowing near Sitio Malabaybay.",
        source: "livestocks",
        indexes: [0],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.livestockHealth,
        priority: "medium",
        entityType: "livestock",
        condition: "sick",
        details:
            "The pregnant goat (LVS-003) has lost her appetite and appears lethargic for the past three days, raising concern ahead of kidding season.",
        source: "livestocks",
        indexes: [2],
        aewStatus: "pending",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.livestockHealth,
        priority: "medium",
        entityType: "livestock",
        condition: "sick",
        details:
            "The native cattle (LVS-008) has developed small skin lesions around the neck, possibly from tick infestation common during the rainy season.",
        source: "livestocks",
        indexes: [7],
        aewStatus: "approved",
        coordinatorStatus: "denied",
    },
    {
        title: REPORT_TITLES.equipmentMalfunction,
        priority: "low",
        entityType: "equipment",
        condition: "maintenance",
        details:
            "The irrigation water pump has been losing pressure over the last few pumping cycles, likely due to a worn impeller that needs replacement.",
        source: "equipments",
        indexes: [1],
        aewStatus: "pending",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.equipmentMalfunction,
        priority: "medium",
        entityType: "equipment",
        condition: "maintenance",
        details:
            "The coconut husker's motor overheats after roughly thirty minutes of continuous use, forcing operators to pause the husking process frequently.",
        source: "equipments",
        indexes: [3],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.cropDamage,
        priority: "critical",
        entityType: "farm",
        stage: "damaged",
        stageData: { damageReason: "flood" },
        details:
            "Continuous heavy rainfall over the past week flooded roughly a third of the rice paddies in this farm, damaging young seedlings that were recently transplanted.",
        source: "farms",
        indexes: [0],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.pestInfestation,
        priority: "high",
        entityType: "farm",
        stage: "damaged",
        stageData: { damageReason: "pest", estimatedLossKg: 800, estimatedLossPesos: undefined },
        details:
            "A fall armyworm infestation has been spreading across the corn-planted section of this farm, with visible leaf damage on a significant number of stalks.",
        source: "farms",
        indexes: [5],
        aewStatus: "denied",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.livestockHealth,
        priority: "medium",
        entityType: "livestock",
        condition: "sick",
        details:
            "Several ducks in the flock (LVS-006) have been observed with nasal discharge and labored breathing, prompting concern over possible avian illness.",
        source: "livestocks",
        indexes: [5],
        aewStatus: "pending",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.equipmentMalfunction,
        priority: "low",
        entityType: "equipment",
        condition: "maintenance",
        details:
            "The knapsack sprayer's nozzle keeps clogging during application, reducing spraying efficiency for fertilizer and pesticide application.",
        source: "equipments",
        indexes: [6],
        aewStatus: "approved",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.farmLand,
        priority: "high",
        entityType: "farm",
        stage: "damaged",
        stageData: { damageReason: "other", damageReasonOther: "Soil erosion" },
        details:
            "Soil erosion has worsened along the sloped section of this highland farm after recent storms, exposing the root systems of several fruit-bearing trees.",
        source: "farms",
        indexes: [9],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    // One example of each remaining crop stage.
    {
        title: REPORT_TITLES.planting,
        priority: "low",
        entityType: "farm",
        stage: "newly_planted",
        details:
            "Seedlings were transplanted across the lowland plot this week using certified seeds; the field was leveled and irrigated beforehand.",
        source: "farms",
        indexes: [0],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.planting,
        priority: "low",
        entityType: "farm",
        stage: "newly_planted",
        stageData: { plantingMethod: "direct_seeded", seedClass: "hybrid", seedQuantity: 25 },
        details:
            "Hybrid corn seeds were direct-seeded on the prepared section of the farm after plowing and harrowing were completed.",
        source: "farms",
        indexes: [5],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.planting,
        priority: "medium",
        entityType: "farm",
        stage: "newly_planted",
        stageData: { seedClass: "registered", seedQuantity: 15, areaPlantedHa: 0.6 },
        details:
            "Seeds were replanted on the highland plot to replace stands lost to erosion; the slope was terraced before planting.",
        source: "farms",
        indexes: [9],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: REPORT_TITLES.cropGrowth,
        priority: "low",
        entityType: "farm",
        stage: "vegetative",
        details:
            "Plants are tillering well with even leaf color across the field; no signs of nutrient deficiency were observed during the visit.",
        source: "farms",
        indexes: [5],
        aewStatus: "approved",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.cropGrowth,
        priority: "medium",
        entityType: "farm",
        stage: "flowering",
        details:
            "Flowering began across most of the field; a few patches show uneven flowering that should be monitored over the next week.",
        source: "farms",
        indexes: [9],
        aewStatus: "pending",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.cropGrowth,
        priority: "medium",
        entityType: "farm",
        stage: "reproductive",
        details:
            "The crop has entered its reproductive stage on schedule; development is uniform and no pest pressure was found on the sampled plants.",
        source: "farms",
        indexes: [0],
        aewStatus: "pending",
        coordinatorStatus: "pending",
    },
    {
        title: REPORT_TITLES.harvest,
        priority: "low",
        entityType: "farm",
        stage: "harvested",
        details:
            "Harvest was completed on the main plot; the produce was dried and graded before part of it was sold to the local trader.",
        source: "farms",
        indexes: [5],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
];

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// Valid stage fields for a seeded crop report (overrides come from the
// seed entry). Government seed stays within the crop's unplanted stock.
function buildStageData(stage, crop, { seedQuantity, ...overrides } = {}) {
    const stock = crop.ownership === "farmer" ? Infinity : crop.unplanted ?? 0;
    const base = {
        newly_planted: {
            datePlanted: daysFromNow(-5), areaPlantedHa: 1.5, plantingMethod: "transplanted", seedClass: "certified",
            seedQuantity: Math.max(1, Math.min(seedQuantity ?? 40, stock)),
            expectedHarvestDate: daysFromNow(100), seedOwnership: crop.ownership ?? "government", expectedYieldKg: 6000,
        },
        vegetative: { dateStarted: daysFromNow(-20), areaHa: 1.2, condition: "good" },
        flowering: { dateStarted: daysFromNow(-3), areaHa: 0.8, condition: "fair" },
        reproductive: { dateObserved: daysFromNow(-2), areaHa: 1, subStage: reproductiveSubStagesFor(crop.cropType?.name)[0] },
        harvested: (() => {
            const areaHarvestedHa = 2;
            const totalProductionValue = 7.5;
            const totalProductionUnit = "MT";
            const totalProductionKg = toProductionKg(totalProductionValue, totalProductionUnit);
            return {
                dateHarvested: daysFromNow(-7), areaHarvestedHa, totalProductionValue, totalProductionUnit, totalProductionKg,
                yieldPerHaKg: totalProductionKg / areaHarvestedHa, qualityGrade: "grade_a", disposition: "sold",
            };
        })(),
        damaged: { dateOccurred: daysFromNow(-4), areaAffectedHa: 0.75, estimatedLossKg: 1200, estimatedLossPesos: 25000 },
    }[stage];
    return Object.fromEntries(Object.entries({ ...base, ...overrides }).filter(([, value]) => value !== undefined));
}

// The stage's main date becomes the report date (as the API does).
const STAGE_DATE = { newly_planted: "datePlanted", vegetative: "dateStarted", flowering: "dateStarted", reproductive: "dateObserved", harvested: "dateHarvested", damaged: "dateOccurred" };

const APPROVAL_REMARKS = {
    approved: "Verified on-site and confirmed accurate.",
    denied: "Unable to verify the reported condition on-site.",
};

// Builds one leg of `approvalStatus` (aew or coordinator). Pending legs
// stay untouched by an approver so they read as still awaiting action.
const buildApproval = (status, approver) => {
    if (status === "pending" || !approver) {
        return { status: "pending" };
    }

    return {
        status,
        approvedBy: approver._id,
        approvedAt: new Date(),
        remarks: APPROVAL_REMARKS[status] ?? "",
    };
};

export const wipeReports = async () => {
    const result = await Report.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} report(s).`);
};

// Requires farms, livestocks, equipments, and users to already be seeded:
// the reported item(s) are pulled from those collections, and the
// approval stages are attributed to the seeded aew/coordinator users.
export const seedReports = async ({ farms, livestocks, equipments, users, farmers } = {}) => {
    if (!farms?.length || !livestocks?.length || !equipments?.length) {
        throw new Error("seedReports requires farms, livestocks, and equipments to already be seeded");
    }

    const aewUser = users?.find((u) => u.role === "aew") ?? null;
    const coordinatorUser = users?.find((u) => u.role === "coordinator") ?? null;
    if (!aewUser || !coordinatorUser) throw new Error("seedReports requires seeded AEW and coordinator users");

    const sources = { farms, livestocks, equipments };
    const reports = [];

    for (const data of REPORTS_TO_SEED) {
        const collection = sources[data.source];
        const items = data.indexes.map((i) => collection[i]);
        const association = items[0]?.association ?? null;
        if (items.some((item) => !item) || !association || items.some((item) => String(item.association) !== String(association))) {
            throw new Error(`seedReports: all items in "${data.title}" must exist in the same association`);
        }
        if (data.entityType === "farm" && items.some((farm) => !farm.crops?.length)) throw new Error(`seedReports: "${data.title}" requires planted crops`);

        // One crop per crop report, with the farmer that crop is assigned to.
        const cropEntry = data.entityType === "farm" ? items[0].crops[data.cropEntryIndex ?? 0] : null;
        const crop = cropEntry ? await Crop.findById(cropEntry.crop).select("assignedFarmer ownership unplanted cropType").populate(CROP_TYPE_POPULATE).lean() : null;
        if (cropEntry && (!crop?.assignedFarmer || !items[0].assignedFarmers.some((entry) => String(entry.farmer) === String(crop.assignedFarmer)))) {
            throw new Error(`seedReports: "${data.title}" needs a crop whose farmer is assigned to the farm`);
        }

        const stageData = cropEntry ? buildStageData(data.stage, crop, data.stageData) : undefined;

        // Livestock kinds and equipment usage.
        const reportKind = data.entityType === "livestock" ? data.reportKind ?? "condition" : undefined;
        const usageFarmer = data.usageStatus === "in_use"
            ? farmers?.find((farmer) => String(farmer.association) === String(association))
            : null;
        if (data.usageStatus === "in_use" && !usageFarmer) throw new Error(`seedReports: "${data.title}" needs a farmer in the equipment's association`);
        // Redispersal: from the animal's farmer to another farmer of the association.
        const associationFarmers = (farmers ?? []).filter((farmer) => String(farmer.association) === String(association));
        const redispersal = reportKind === "redispersal"
            ? (item) => {
                const from = associationFarmers.find((farmer) => String(farmer._id) === String(item.assignedFarmer)) ?? associationFarmers[0];
                const to = associationFarmers.find((farmer) => String(farmer._id) !== String(from?._id));
                if (!from || !to) throw new Error(`seedReports: "${data.title}" needs two farmers in the livestock's association`);
                return { fromFarmer: from._id, toFarmer: to._id };
            }
            : null;
        if (reportKind === "offspring" && (items[0].gender !== "female" || items[0].condition === "deceased")) {
            throw new Error(`seedReports: "${data.title}" needs a living female mother`);
        }
        const deceased = data.deceased ? { cause: data.deceased.cause, dateOfDeath: daysFromNow(-data.deceased.daysAgo) } : undefined;

        const report = await Report.create({
            association,
            title: data.title,
            priority: data.priority,
            entityType: data.entityType,
            parentId: data.entityType === "farm" ? items[0]._id : null,
            farmer: crop?.assignedFarmer,
            reportedAt: stageData ? stageData[STAGE_DATE[data.stage]] : undefined,
            cropEntries: cropEntry ? [{ crop: cropEntry.crop, stage: data.stage, priority: data.priority, stageData }] : [],
            submittedByRole: data.entityType === "farm" || data.coordinatorStatus === "pending" ? "far" : "aew",
            itemIds: cropEntry ? [cropEntry.crop] : items.map((item) => item._id),
            reportKind,
            offspring: reportKind === "offspring"
                ? { mother: items[0]._id, count: data.offspring.count, birthDate: daysFromNow(-data.offspring.daysAgo), notes: data.offspring.notes }
                : undefined,
            items: data.entityType === "farm" || reportKind === "offspring" ? [] : items.map((item) => ({
                item: item._id, condition: data.condition, priority: data.priority,
                ...(deceased ? { deceased } : {}),
                ...(data.entityType === "equipment"
                    ? { usageStatus: data.usageStatus ?? "idle", ...(usageFarmer ? { farmer: usageFarmer._id } : {}) }
                    : {}),
                ...(redispersal ? redispersal(item) : {}),
            })),
            details: data.details,
            attachments: [PLACEHOLDER_ATTACHMENT],
            approvalStatus: {
                ...(data.entityType === "farm"
                    ? {
                        aew: buildApproval(data.aewStatus, aewUser),
                        ...(data.aewStatus === "approved" ? { coordinator: buildApproval(data.coordinatorStatus, coordinatorUser) } : {}),
                    }
                    : data.coordinatorStatus === "pending"
                    ? { aew: buildApproval(data.aewStatus, aewUser) }
                    : { coordinator: buildApproval(data.coordinatorStatus, coordinatorUser) }),
            },
        });

        // As in the review flow, only equipment and condition-kind livestock
        // reports update records; offspring and redispersal change nothing.
        const updatesRecords = data.entityType === "equipment" || reportKind === "condition";
        if (updatesRecords && ["aew", "coordinator"].some((stage) => report.approvalStatus[stage]?.status === "approved")) {
            const Model = data.entityType === "equipment" ? Equipment : Livestock;
            for (const item of items) {
                const changes = { condition: data.condition, ...(data.entityType === "livestock" ? { deceasedAt: data.condition === "deceased" ? deceased?.dateOfDeath ?? new Date() : null } : {}) };
                await Model.updateOne({ _id: item._id }, { $set: changes, ...(data.entityType === "livestock" ? { $inc: { __v: 1 } } : {}) }, { runValidators: true });
                Object.assign(item, changes);
            }
        }
        reports.push(report);
        console.log(`  Seeded: ${report.title} (${report.entityType}, ${report.priority})`);
    }

    return { reports };
};
