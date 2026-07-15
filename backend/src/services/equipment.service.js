import Equipment from "../models/equipment.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

export const createEquipment = async (data, authenticatedUserId) => {
    const { associationId, ...equipmentData } = data;

    const existing = await Equipment.findOne({ tag: equipmentData.tag, deletedAt: null });

    if (existing) {
        throw new Error("Equipment with this tag already exists");
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const equipment = await Equipment.create({
        ...equipmentData,
        association: resolvedAssociationId || undefined,
    });

    await createLog({
        entityType: "equipment",
        entityId: equipment._id,
        association: equipment.association,
        message: `${equipment.name} (${equipment.tag}) has been added to the equipment inventory.`,
    });

    if (equipment.association) {
        const association = await Association.findById(equipment.association).select("name");

        await createLog({
            entityType: "equipment",
            entityId: equipment._id,
            association: equipment.association,
            message: `${equipment.name} (${equipment.tag}) has been assigned to ${association?.name ?? "an association"}.`,
        });
    }

    if (equipment.assignedFarmer) {
        const farmer = await Farmer.findById(equipment.assignedFarmer).select("firstName lastName");
        const farmerName = farmer?.getFullName() ?? "a farmer";

        await createLog({
            entityType: "equipment",
            entityId: equipment._id,
            association: equipment.association,
            message: `${equipment.name} (${equipment.tag}) has been assigned to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: equipment.assignedFarmer,
            association: equipment.association,
            message: `${farmer ? farmer.getFullName() : "The farmer"} has received ${equipment.name} (${equipment.tag}).`,
        });
    }

    await equipment.populate([
        { path: "assignedFarmer", select: "firstName lastName" },
        ASSOCIATION_POPULATE,
    ]);

    return equipment;
};

export const updateEquipment = async (id, data) => {
    const { associationId, ...equipmentData } = data;
    if (associationId !== undefined) {
        equipmentData.association = associationId;
    }

    if (equipmentData.tag) {
        const existing = await Equipment.findOne({
            tag: equipmentData.tag,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            throw new Error("Equipment with this tag already exists");
        }
    }

    const needsPrevious =
        equipmentData.assignedFarmer !== undefined ||
        equipmentData.condition !== undefined ||
        equipmentData.association !== undefined;
    const previousEquipment = needsPrevious
        ? await Equipment.findOne({ _id: id, deletedAt: null }).select("assignedFarmer condition name tag association")
        : null;

    if (equipmentData.assignedFarmer !== undefined && equipmentData.status === undefined) {
        equipmentData.status = equipmentData.assignedFarmer ? "assigned" : "available";
    }

    const update = { ...equipmentData };
    const unset = {};
    if (update.assignedFarmer === null) {
        delete update.assignedFarmer;
        unset.assignedFarmer = "";
    }

    const equipment = await Equipment.findOneAndUpdate(
        { _id: id, deletedAt: null },
        {
            $set: update,
            ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { new: true, runValidators: true },
    ).populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE]);

    if (!equipment) {
        const notFoundError = new Error("Equipment not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (
        equipmentData.association !== undefined &&
        String(previousEquipment?.association ?? "") !== String(equipment.association?._id ?? equipment.association ?? "")
    ) {
        if (equipment.association) {
            const association = await Association.findById(equipment.association._id ?? equipment.association).select("name");

            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: equipment.association._id ?? equipment.association,
                message: `${equipment.name} (${equipment.tag}) has been assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: previousEquipment?.association,
                message: `${equipment.name} (${equipment.tag}) has been removed from its association.`,
            });
        }
    }

    if (
        equipmentData.assignedFarmer !== undefined &&
        String(previousEquipment?.assignedFarmer ?? "") !== String(equipment.assignedFarmer?._id ?? "")
    ) {
        if (equipment.assignedFarmer) {
            const assignedName = equipment.assignedFarmer.getFullName?.() ?? "a farmer";

            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: equipment.association?._id ?? equipment.association,
                message: `${equipment.name} (${equipment.tag}) has been assigned to ${assignedName}.`,
            });

            await createLog({
                entityType: "farmer",
                entityId: equipment.assignedFarmer._id,
                association: equipment.association?._id ?? equipment.association,
                message: `${equipment.assignedFarmer.getFullName?.() ?? "The farmer"} has received ${equipment.name} (${equipment.tag}).`,
            });
        } else {
            const previousFarmer = previousEquipment?.assignedFarmer
                ? await Farmer.findById(previousEquipment.assignedFarmer).select("firstName lastName")
                : null;

            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: equipment.association?._id ?? equipment.association,
                message: `${equipment.name} (${equipment.tag}) has been returned.`,
            });

            if (previousFarmer) {
                await createLog({
                    entityType: "farmer",
                    entityId: previousEquipment.assignedFarmer,
                    association: equipment.association?._id ?? equipment.association,
                    message: `${previousFarmer.getFullName()} has returned ${equipment.name} (${equipment.tag}).`,
                });
            }
        }
    }

    if (
        equipmentData.condition !== undefined &&
        previousEquipment?.condition !== equipment.condition
    ) {
        await createLog({
            entityType: "equipment",
            entityId: equipment._id,
            association: equipment.association?._id ?? equipment.association,
            message: `${equipment.name} (${equipment.tag})'s condition has been changed from ${previousEquipment?.condition ?? "unknown"} to ${equipment.condition}.`,
        });
    }

    return equipment;
};

export const deleteEquipment = async (id) => {
    const equipment = await Equipment.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!equipment) {
        const notFoundError = new Error("Equipment not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return equipment;
};

export const restoreEquipment = async (id) => {
    const toRestore = await Equipment.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted equipment not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const tagTaken = await Equipment.findOne({
        _id: { $ne: id },
        tag: toRestore.tag,
        deletedAt: null,
    });

    if (tagTaken) {
        const conflictError = new Error("An active equipment with this tag already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachHistory = async (equipments, associationId) => {
    const equipmentIds = equipments.map((e) => e._id);

    if (!equipmentIds.length) return [];

    const logsByEquipmentId = await getLogsForEntities(
        "equipment",
        equipmentIds,
        associationId,
    );

    return equipments.map((e) => {
        const obj = typeof e.toObject === "function" ? e.toObject() : e;
        const key = obj._id.toString();
        return {
            ...obj,
            history: logsByEquipmentId.get(key) ?? [],
        };
    });
};

export const getEquipments = async ({
    condition,
    status,
    search,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (condition) filter.condition = condition;
    if (status) filter.status = status;
    if (associationId) filter.association = associationId;

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const equipments = await Equipment.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE])
            .sort({ createdAt: -1 });

        return {
            equipments: await attachHistory(equipments, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [equipments, total] = await Promise.all([
        Equipment.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Equipment.countDocuments(filter),
    ]);

    return {
        equipments: await attachHistory(equipments, associationId),
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