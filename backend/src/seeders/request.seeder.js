import Request from "../models/request.model.js";
import { inventoryModels, inventoryKey, availabilityFilter } from "../services/availability.service.js";

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
        headStatus: "approved",
        releaseStatus: "pending",
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
        governorStatus: "pending",
        headStatus: "denied",
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
        title: "Request for goat and duck for livelihood diversification",
        severity: "medium",
        entityType: "livestock",
        details:
            "A group of members proposing a joint small-livestock project is requesting a native goat and a duck to start raising alongside their crops.",
        source: "livestocks",
        propertyNumbers: ["LVS-013", "LVS-012"],
        coordinatorStatus: "approved",
        governorStatus: "approved",
        headStatus: "approved",
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
    if (!coordinatorUser || !governorUser || !headUser) throw new Error("seedRequests requires seeded coordinator, governor, and head users");

    // Requests are raised on behalf of an association; default to the
    // first seeded association (the one the "far" user is attached to).
    const defaultAssociation = associations?.find((association) => association.user) ?? associations?.[0];
    if (!defaultAssociation) throw new Error("seedRequests requires a seeded association");

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

        const grouped = new Map();
        for (const item of items) {
            if (!item[inventoryKey(data.entityType)]) throw new Error(`seedRequests: ${item.propertyNumber} is missing its maintenance type link`);
            const key = String(item[inventoryKey(data.entityType)]);
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
        }
        const approvalStatus = { coordinator: buildApproval(data.coordinatorStatus, coordinatorUser) };
        if (data.coordinatorStatus === "approved") {
            if (data.entityType === "equipment") {
                approvalStatus.governor = buildApproval(data.governorStatus, governorUser);
                if (data.governorStatus === "approved") approvalStatus.head = buildApproval(data.headStatus, headUser);
            } else {
                approvalStatus.head = buildApproval(data.headStatus, headUser);
            }
        }
        const request = await Request.create({
            association: defaultAssociation?._id ?? null,
            title: data.title,
            severity: data.severity,
            entityType: data.entityType,
            lines: [...grouped].map(([key, quantity]) => ({ key, name: items.find((item) => String(item[inventoryKey(data.entityType)]) === key)?.[data.entityType === "equipment" ? "name" : "animal"], quantity })),
            entityIds: [],
            details: data.details,
            approvalStatus,
            releaseStatus: "pending",
        });

        if (request.approvalStatus.head?.status === "approved") {
            const Model = inventoryModels[data.entityType];
            const selected = [];
            for (const line of request.lines) {
                const docs = await Model.find({ ...availabilityFilter(data.entityType), [inventoryKey(data.entityType)]: line.key })
                    .sort({ createdAt: 1, propertyNumber: 1, _id: 1 }).limit(line.quantity);
                if (docs.length !== line.quantity) break;
                selected.push(...docs.map((doc) => doc._id));
            }
            const quantity = request.lines.reduce((total, line) => total + line.quantity, 0);
            if (selected.length === quantity) {
                await Model.updateMany({ _id: { $in: selected }, ...availabilityFilter(data.entityType) }, { $set: { reservedBy: request._id } });
                request.entityIds = selected;
                if (["released", "partial"].includes(data.releaseStatus)) {
                    const released = data.releaseStatus === "released" ? selected : selected.slice(0, Math.max(1, Math.floor(quantity / 2)));
                    await Model.updateMany({ _id: { $in: released }, reservedBy: request._id }, {
                        $set: { association: request.association, status: "assigned" }, $unset: { reservedBy: "" },
                    });
                    request.releasedIds = released;
                    request.releaseStatus = released.length === quantity ? "released" : "partial";
                }
                const released = new Set(request.releasedIds.map(String));
                for (const item of sources[data.source].values()) {
                    if (!selected.some((id) => String(id) === String(item._id))) continue;
                    item.reservedBy = released.has(String(item._id)) ? null : request._id;
                    if (released.has(String(item._id))) {
                        item.association = request.association;
                        item.status = "assigned";
                    }
                }
            } else {
                request.approvalStatus.head = { status: "pending" };
            }
            await request.save();
        }

        requests.push(request);
        console.log(`  Seeded: ${request.title} (${request.entityType}, release: ${request.releaseStatus})`);
    }

    return { requests };
};
