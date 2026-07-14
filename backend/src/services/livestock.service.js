import Livestock from "../models/livestock.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

export const createLivestock = async (data, authenticatedUserId) => {
    const { associationId, ...livestockData } = data;

    const existing = await Livestock.findOne({ tag: livestockData.tag, deletedAt: null });

    if (existing) {
        throw new Error("Livestock with this tag already exists");
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const livestock = await Livestock.create({
        ...livestockData,
        association: resolvedAssociationId || undefined,
    });

    await createLog({
        entityType: "livestock",
        entityId: livestock._id,
        association: livestock.association,
        message: `${livestock.animal} (${livestock.tag}) has been added to the livestock inventory.`,
    });

    if (livestock.association) {
        const association = await Association.findById(livestock.association).select("name");

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.tag}) has been assigned to ${association?.name ?? "an association"}.`,
        });
    }

    if (livestock.assignedFarmer) {
        const farmer = await Farmer.findById(livestock.assignedFarmer).select("fullName");

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.tag}) has been assigned to ${farmer?.fullName ?? "a farmer"}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: livestock.assignedFarmer,
            association: livestock.association,
            message: `${farmer?.fullName ?? "The farmer"} has received ${livestock.animal} (${livestock.tag}).`,
        });
    }

    await livestock.populate("assignedFarmer", "fullName");

    return livestock;
};

export const updateLivestock = async (id, data) => {
    const { associationId, ...livestockData } = data;
    if (associationId !== undefined) {
        livestockData.association = associationId;
    }

    if (livestockData.tag) {
        const existing = await Livestock.findOne({
            tag: livestockData.tag,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            throw new Error("Livestock with this tag already exists");
        }
    }

    const needsPrevious =
        livestockData.assignedFarmer !== undefined ||
        livestockData.condition !== undefined ||
        livestockData.association !== undefined;
    const previousLivestock = needsPrevious
        ? await Livestock.findOne({ _id: id, deletedAt: null }).select("assignedFarmer condition animal tag association")
        : null;

    if (livestockData.assignedFarmer !== undefined && livestockData.status === undefined) {
        livestockData.status = livestockData.assignedFarmer ? "assigned" : "available";
    }

    const update = { ...livestockData };
    const unset = {};
    if (update.assignedFarmer === null) {
        delete update.assignedFarmer;
        unset.assignedFarmer = "";
    }

    const livestock = await Livestock.findOneAndUpdate(
        { _id: id, deletedAt: null },
        {
            $set: update,
            ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { new: true, runValidators: true },
    ).populate("assignedFarmer", "fullName");

    if (!livestock) {
        const notFoundError = new Error("Livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (
        livestockData.association !== undefined &&
        String(previousLivestock?.association ?? "") !== String(livestock.association ?? "")
    ) {
        if (livestock.association) {
            const association = await Association.findById(livestock.association).select("name");

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association,
                message: `${livestock.animal} (${livestock.tag}) has been assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: previousLivestock?.association,
                message: `${livestock.animal} (${livestock.tag}) has been removed from its association.`,
            });
        }
    }

    if (
        livestockData.assignedFarmer !== undefined &&
        String(previousLivestock?.assignedFarmer ?? "") !== String(livestock.assignedFarmer?._id ?? "")
    ) {
        if (livestock.assignedFarmer) {
            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association,
                message: `${livestock.animal} (${livestock.tag}) has been assigned to ${livestock.assignedFarmer?.fullName ?? "a farmer"}.`,
            });

            await createLog({
                entityType: "farmer",
                entityId: livestock.assignedFarmer._id,
                association: livestock.association,
                message: `${livestock.assignedFarmer?.fullName ?? "The farmer"} has received ${livestock.animal} (${livestock.tag}).`,
            });
        } else {
            const previousFarmer = previousLivestock?.assignedFarmer
                ? await Farmer.findById(previousLivestock.assignedFarmer).select("fullName")
                : null;

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association,
                message: `${livestock.animal} (${livestock.tag}) has been returned.`,
            });

            if (previousFarmer) {
                await createLog({
                    entityType: "farmer",
                    entityId: previousLivestock.assignedFarmer,
                    association: livestock.association,
                    message: `${previousFarmer.fullName} has returned ${livestock.animal} (${livestock.tag}).`,
                });
            }
        }
    }

    if (
        livestockData.condition !== undefined &&
        previousLivestock?.condition !== livestock.condition
    ) {
        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.tag})'s condition has been changed from ${previousLivestock?.condition ?? "unknown"} to ${livestock.condition}.`,
        });
    }

    return livestock;
};

export const deleteLivestock = async (id) => {
    const livestock = await Livestock.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!livestock) {
        const notFoundError = new Error("Livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return livestock;
};

export const restoreLivestock = async (id) => {
    const toRestore = await Livestock.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const tagTaken = await Livestock.findOne({
        _id: { $ne: id },
        tag: toRestore.tag,
        deletedAt: null,
    });

    if (tagTaken) {
        const conflictError = new Error("An active livestock record with this tag already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachHistory = async (livestocks, associationId) => {
    const livestockIds = livestocks.map((l) => l._id);

    if (!livestockIds.length) return [];

    const logsByLivestockId = await getLogsForEntities(
        "livestock",
        livestockIds,
        associationId,
    );

    return livestocks.map((l) => {
        const obj = typeof l.toObject === "function" ? l.toObject() : l;
        const key = obj._id.toString();
        return {
            ...obj,
            history: logsByLivestockId.get(key) ?? [],
        };
    });
};

export const getLivestocks = async ({
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
        filter.animal = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const livestocks = await Livestock.find(filter)
            .populate("assignedFarmer", "fullName")
            .sort({ createdAt: -1 });

        return {
            livestocks: await attachHistory(livestocks, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [livestocks, total] = await Promise.all([
        Livestock.find(filter)
            .populate("assignedFarmer", "fullName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Livestock.countDocuments(filter),
    ]);

    return {
        livestocks: await attachHistory(livestocks, associationId),
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