import Report from "../models/report.model.js";

// Each entry sources its item(s) from an already-seeded collection
// (`farms`, `livestocks`, or `equipments`) by index, so `itemIds` (and
// `parentId` for farm reports) always point at real documents.
const REPORTS_TO_SEED = [
    {
        title: "Rice Thresher malfunctioning",
        severity: "high",
        entityType: "equipment",
        condition: "damaged",
        details:
            "The rice thresher (EQP-003) has been producing a grinding noise and stalled midway through threshing during the last harvest. It needs immediate repair before the next cropping season.",
        source: "equipments",
        indexes: [2],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: "Grass Cutter blade damage",
        severity: "medium",
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
        title: "Carabao showing signs of lameness",
        severity: "high",
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
        title: "Pregnant goat showing signs of illness",
        severity: "medium",
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
        title: "Cattle with skin lesions",
        severity: "medium",
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
        title: "Water Pump losing pressure",
        severity: "low",
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
        title: "Coconut Husker overheating",
        severity: "medium",
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
        title: "Damaged rice crop after heavy rains",
        severity: "critical",
        entityType: "farm",
        condition: "damaged",
        details:
            "Continuous heavy rainfall over the past week flooded roughly a third of the rice paddies in this farm, damaging young seedlings that were recently transplanted.",
        source: "farms",
        indexes: [0],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
    {
        title: "Pest infestation on corn plot",
        severity: "high",
        entityType: "farm",
        condition: "damaged",
        details:
            "A fall armyworm infestation has been spreading across the corn-planted section of this farm, with visible leaf damage on a significant number of stalks.",
        source: "farms",
        indexes: [6],
        aewStatus: "denied",
        coordinatorStatus: "pending",
    },
    {
        title: "Duck flock showing respiratory symptoms",
        severity: "medium",
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
        title: "Sprayer nozzle clogging",
        severity: "low",
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
        title: "Erosion along highland farm slope",
        severity: "high",
        entityType: "farm",
        condition: "damaged",
        details:
            "Soil erosion has worsened along the sloped section of this highland farm after recent storms, exposing the root systems of several fruit-bearing trees.",
        source: "farms",
        indexes: [9],
        aewStatus: "approved",
        coordinatorStatus: "approved",
    },
];

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
export const seedReports = async ({ farms, livestocks, equipments, users } = {}) => {
    if (!farms?.length || !livestocks?.length || !equipments?.length) {
        throw new Error("seedReports requires farms, livestocks, and equipments to already be seeded");
    }

    const aewUser = users?.find((u) => u.role === "aew") ?? null;
    const coordinatorUser = users?.find((u) => u.role === "coordinator") ?? null;

    const sources = { farms, livestocks, equipments };
    const reports = [];

    for (const data of REPORTS_TO_SEED) {
        const collection = sources[data.source];
        const items = data.indexes.map((i) => collection[i]);
        const association = items[0]?.association ?? null;

        const report = await Report.create({
            association,
            title: data.title,
            severity: data.severity,
            entityType: data.entityType,
            parentId: data.entityType === "farm" ? items[0]._id : null,
            condition: data.condition,
            itemIds: items.map((item) => item._id),
            details: data.details,
            approvalStatus: {
                aew: buildApproval(data.aewStatus, aewUser),
                coordinator: buildApproval(data.coordinatorStatus, coordinatorUser),
            },
        });

        reports.push(report);
        console.log(`  Seeded: ${report.title} (${report.entityType}, ${report.severity})`);
    }

    return { reports };
};