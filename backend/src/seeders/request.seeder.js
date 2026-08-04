import Request from "../models/request.model.js";

// Each entry sources its item(s) from the pool of *unassigned* livestock
// or equipment (see the UNASSIGNED_* arrays in livestock.seeder.js /
// equipment.seeder.js), matching how real requests target existing,
// unclaimed entities rather than ones already given to a farmer.
const REQUESTS_TO_SEED = [
    {
        title: "Request for a corn sheller unit",
        severity: "medium",
        entityType: "equipment",
        details:
            "Farmers in this association need a corn sheller unit to process their upcoming corn harvest more efficiently instead of relying on manual shelling.",
        source: "equipments",
        propertyNumbers: ["EQP-009"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Request for a weeding machine",
        severity: "low",
        entityType: "equipment",
        details:
            "The association would like to borrow a weeding machine to clear overgrown grass along the rice paddies before the next planting season.",
        source: "equipments",
        propertyNumbers: ["EQP-010"],
        coordinatorStatus: "approved",
        governorStatus: "pending",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Request for a sickle bar mower",
        severity: "medium",
        entityType: "equipment",
        details:
            "A sickle bar mower is needed to speed up rice harvesting for members who currently rely entirely on manual cutting.",
        source: "equipments",
        propertyNumbers: ["EQP-011"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "approved",
        releaseStatus: "released",
    },
    {
        title: "Request for a replacement multi-purpose dryer",
        severity: "high",
        entityType: "equipment",
        details:
            "The association's shared drying facility broke down after recent storms, and grains from the last harvest are at risk of spoilage without a working dryer.",
        source: "equipments",
        propertyNumbers: ["EQP-012"],
        coordinatorStatus: "denied",
        governorStatus: "pending",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Request for broiler chicken stock",
        severity: "low",
        entityType: "livestock",
        details:
            "Members interested in poultry raising as a supplemental livelihood are requesting broiler chicken stock to start a small backyard flock.",
        source: "livestocks",
        propertyNumbers: ["LVS-010"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "pending",
        releaseStatus: "partial",
    },
    {
        title: "Request for a native piglet",
        severity: "medium",
        entityType: "livestock",
        details:
            "A member wishes to begin raising native pigs and is requesting a piglet from the association's livestock inventory to get started.",
        source: "livestocks",
        propertyNumbers: ["LVS-011"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "approved",
        releaseStatus: "released",
    },
    {
        title: "Request for mallard duck stock",
        severity: "low",
        entityType: "livestock",
        details:
            "The association is requesting mallard ducks to distribute to members near the coastal barangays as part of a livelihood diversification effort.",
        source: "livestocks",
        propertyNumbers: ["LVS-012"],
        coordinatorStatus: "pending",
        governorStatus: "pending",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Request for a native goat",
        severity: "medium",
        entityType: "livestock",
        details:
            "A farmer-member is requesting a native goat to raise alongside existing livestock, citing strong local demand for goat meat.",
        source: "livestocks",
        propertyNumbers: ["LVS-013"],
        coordinatorStatus: "approved",
        governorStatus: "denied",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Combined request for corn sheller and weeding machine",
        severity: "medium",
        entityType: "equipment",
        details:
            "The association is requesting both a corn sheller and a weeding machine together to prepare for the upcoming corn planting and harvest cycle.",
        source: "equipments",
        propertyNumbers: ["EQP-009", "EQP-010"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "approved",
        releaseStatus: "partial",
    },
    {
        title: "Combined poultry restocking request",
        severity: "low",
        entityType: "livestock",
        details:
            "Following losses from a recent poultry disease outbreak, the association is requesting broiler chickens and mallard ducks to help members restock.",
        source: "livestocks",
        propertyNumbers: ["LVS-010", "LVS-012"],
        coordinatorStatus: "approved",
        governorStatus: "pending",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Urgent request for dryer after storm damage",
        severity: "critical",
        entityType: "equipment",
        details:
            "With the shared dryer still out of commission after the recent storm, the association is elevating this as an urgent request ahead of the next harvest.",
        source: "equipments",
        propertyNumbers: ["EQP-012"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "pending",
        releaseStatus: "pending",
    },
    {
        title: "Request for goat and piglet for livelihood diversification",
        severity: "medium",
        entityType: "livestock",
        details:
            "A group of members proposing a joint small-livestock project is requesting a native goat and a piglet to start raising alongside their crops.",
        source: "livestocks",
        propertyNumbers: ["LVS-013", "LVS-011"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "pending",
        releaseStatus: "partial",
    },
];

const APPROVAL_REMARKS = {
    approved: "Reviewed and confirmed as a valid need.",
    denied: "Insufficient inventory to accommodate this request at this time.",
};

// Builds one leg of `approvalStatus` (coordinator, governor, or head).
// Pending legs stay untouched by an approver so they read as still
// awaiting action.
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

export const wipeRequests = async () => {
    const result = await Request.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} request(s).`);
};

// Requires livestocks, equipments, and users to already be seeded. Only
// the *unassigned* livestock/equipment (association: null) are eligible
// targets, since those are the ones sitting in inventory for a "far" user
// to request. `association` on the request itself is picked from a
// seeded association's farmer pool via the users' assigned association.
export const seedRequests = async ({ livestocks, equipments, associations, users } = {}) => {
    if (!livestocks?.length || !equipments?.length) {
        throw new Error("seedRequests requires livestocks and equipments to already be seeded");
    }

    const coordinatorUser = users?.find((u) => u.role === "coordinator") ?? null;
    const governorUser = users?.find((u) => u.role === "governor") ?? null;
    const headUser = users?.find((u) => u.role === "head") ?? null;

    // Requests are raised on behalf of an association; default to the
    // first seeded association (the one the "far" user is attached to).
    const defaultAssociation = associations?.[0] ?? null;

    const sources = {
        livestocks: new Map(livestocks.map((l) => [l.propertyNumber, l])),
        equipments: new Map(equipments.map((e) => [e.propertyNumber, e])),
    };

    const requests = [];

    for (const data of REQUESTS_TO_SEED) {
        const lookup = sources[data.source];
        const items = data.propertyNumbers.map((propertyNumber) => {
            const item = lookup.get(propertyNumber);
            if (!item) {
                throw new Error(`seedRequests: no ${data.source} item found for ${propertyNumber}`);
            }
            return item;
        });

        const request = await Request.create({
            association: defaultAssociation?._id ?? null,
            title: data.title,
            severity: data.severity,
            entityType: data.entityType,
            entityIds: items.map((item) => item._id),
            details: data.details,
            approvalStatus: {
                coordinator: buildApproval(data.coordinatorStatus, coordinatorUser),
                governor: buildApproval(data.governorStatus, governorUser),
                head: buildApproval(data.headStatus, headUser),
            },
            releaseStatus: data.releaseStatus,
        });

        requests.push(request);
        console.log(`  Seeded: ${request.title} (${request.entityType}, release: ${request.releaseStatus})`);
    }

    return { requests };
};