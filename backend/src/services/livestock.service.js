import Livestock from "../models/livestock.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";
import { assertAssignable } from "../utils/assignment.js";
import { LIVESTOCK_RELATION_FIELDS, MOTHER_POPULATE, livestockAccessFilter, lineageChanged, lineageError, validateLivestockLineage, withLivestockLineageTransaction } from "./livestockLineage.service.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

export const createLivestock = async (data, authenticatedUserId, actingUser) => {
    const { associationId, ...livestockData } = data;

    const existing = await Livestock.findOne({ propertyNumber: livestockData.propertyNumber, deletedAt: null });

    if (existing) {
        const error = new Error("Property number is already in use");
        error.statusCode = 409;
        throw error;
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    if (resolvedAssociationId || livestockData.assignedFarmer) assertAssignable("livestock", livestockData.condition);
    const record = {
        ...livestockData,
        association: resolvedAssociationId || undefined,
        status: resolvedAssociationId ? "assigned" : "available",
        deceasedAt: livestockData.condition === "deceased" ? new Date() : null,
    };
    const livestock = record.mother
        ? await withLivestockLineageTransaction(async (session) => {
            await validateLivestockLineage(null, record, session, actingUser?.role === "far");
            const [created] = await Livestock.create([record], { session });
            return created;
        })
        : await Livestock.create(record);
    if (record.mother) livestock.$session(null);

    await createLog({
        entityType: "livestock",
        entityId: livestock._id,
        association: livestock.association,
        message: `${livestock.animal} (${livestock.propertyNumber}) has been added to the livestock inventory.`,
    });

    if (livestock.association) {
        const association = await Association.findById(livestock.association).select("name");

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
        });
    }

    if (livestock.assignedFarmer) {
        const farmer = await Farmer.findById(livestock.assignedFarmer).select("firstName lastName");
        const farmerName = farmer?.getFullName() ?? "a farmer";

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: livestock.assignedFarmer,
            association: livestock.association,
            message: `${farmer ? farmer.getFullName() : "The farmer"} has received ${livestock.animal} (${livestock.propertyNumber}).`,
        });
    }

    await livestock.populate(["assignedFarmer", ASSOCIATION_POPULATE, MOTHER_POPULATE].map((p) =>
        p === "assignedFarmer" ? { path: "assignedFarmer", select: "firstName lastName" } : p
    ));

    return livestock;
};

export const updateLivestock = async (id, data, actingUser) => {
    const access = await livestockAccessFilter(actingUser);
    const { associationId, ...livestockData } = data;
    if (associationId !== undefined) {
        livestockData.association = associationId;
    }

    if (livestockData.propertyNumber) {
        const existing = await Livestock.findOne({
            propertyNumber: livestockData.propertyNumber,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            const error = new Error("Property number is already in use");
            error.statusCode = 409;
            throw error;
        }
    }

    const previousLivestock = await Livestock.findOne({ _id: id, deletedAt: null, ...access }).select("assignedFarmer condition animal propertyNumber association deceasedAt gender mother __v");
    if (!previousLivestock) throw lineageError("Livestock not found", "mother", 404);
    if (actingUser?.role === "far" && associationId !== undefined && String(associationId ?? "").toLowerCase() !== String(previousLivestock.association ?? "").toLowerCase()) {
        throw lineageError("You cannot move livestock outside your association", "associationId", 403);
    }
    if (actingUser?.role === "far" && data.assignedFarmer && associationId !== null) {
        const farmer = await Farmer.exists({ _id: data.assignedFarmer, association: associationId ?? previousLivestock.association ?? null, deletedAt: null });
        if (!farmer) throw lineageError("Assigned farmer must belong to the livestock association", "assignedFarmer");
    }

    if (livestockData.association === null) {
        livestockData.assignedFarmer = null;
    }

    const association = livestockData.association !== undefined ? livestockData.association : previousLivestock?.association;
    livestockData.status = association ? "assigned" : "available";
    if ((livestockData.association && String(livestockData.association) !== String(previousLivestock?.association ?? "")) ||
        (livestockData.assignedFarmer && String(livestockData.assignedFarmer) !== String(previousLivestock?.assignedFarmer ?? ""))) {
        assertAssignable("livestock", livestockData.condition ?? previousLivestock?.condition);
    }
    if (livestockData.condition !== undefined) {
        livestockData.deceasedAt = livestockData.condition === "deceased"
            ? previousLivestock?.deceasedAt ?? new Date()
            : null;
    }

    const update = { ...livestockData };
    const unset = {};
    if (update.assignedFarmer === null) {
        delete update.assignedFarmer;
        unset.assignedFarmer = "";
    }
    if (update.association === null) {
        delete update.association;
        unset.association = "";
    }

    const changesLineage = lineageChanged(previousLivestock, data);
    const persist = async (session) => {
        if (session) {
            const current = await Livestock.findOne({ _id: id, deletedAt: null, ...access }, null, { session }).select("__v");
            if (!current || current.__v !== previousLivestock.__v) throw lineageError("Livestock changed; refresh and try again", "mother", 409);
            const effective = { ...previousLivestock.toObject(), ...livestockData };
            const selectingMother = data.mother && String(data.mother) !== String(previousLivestock.mother ?? "");
            await validateLivestockLineage(id, effective, session, actingUser?.role === "far" && !!selectingMother);
        }
        return Livestock.findOneAndUpdate(
            { _id: id, deletedAt: null, ...access },
            {
                $set: update,
                $inc: { __v: 1 },
                ...(Object.keys(unset).length ? { $unset: unset } : {}),
            },
            { new: true, runValidators: true, ...(session ? { session } : {}) },
        ).populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, { ...MOTHER_POPULATE, match: { deletedAt: null, ...access } }]);
    };
    const livestock = changesLineage ? await withLivestockLineageTransaction(persist) : await persist();
    if (changesLineage && livestock) livestock.$session(null);

    if (!livestock) {
        const notFoundError = new Error("Livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (
        livestockData.association !== undefined &&
        String(previousLivestock?.association ?? "") !== String(livestock.association?._id ?? livestock.association ?? "")
    ) {
        if (livestock.association) {
            const association = await Association.findById(livestock.association._id ?? livestock.association).select("name");

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: previousLivestock?.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been returned and removed from its association.`,
            });
        }
    }

    if (
        livestockData.assignedFarmer !== undefined &&
        String(previousLivestock?.assignedFarmer ?? "") !== String(livestock.assignedFarmer?._id ?? "")
    ) {
        if (livestock.assignedFarmer) {
            const assignedName = livestock.assignedFarmer.getFullName?.() ?? "a farmer";

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${assignedName}.`,
            });

            await createLog({
                entityType: "farmer",
                entityId: livestock.assignedFarmer._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.assignedFarmer.getFullName?.() ?? "The farmer"} has received ${livestock.animal} (${livestock.propertyNumber}).`,
            });
        } else {
            const previousFarmer = previousLivestock?.assignedFarmer
                ? await Farmer.findById(previousLivestock.assignedFarmer).select("firstName lastName")
                : null;

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been returned.`,
            });

            if (previousFarmer) {
                await createLog({
                    entityType: "farmer",
                    entityId: previousLivestock.assignedFarmer,
                    association: livestock.association?._id ?? livestock.association,
                    message: `${previousFarmer.getFullName()} has returned ${livestock.animal} (${livestock.propertyNumber}).`,
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
            association: livestock.association?._id ?? livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber})'s condition has been changed from ${previousLivestock?.condition ?? "unknown"} to ${livestock.condition}.`,
        });
    }

    return livestock;
};

export const deleteLivestock = async (id) => {
    return withLivestockLineageTransaction(async (session) => {
        const livestock = await Livestock.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { $set: { deletedAt: new Date(), mother: null }, $inc: { __v: 1 } },
            { new: true, session },
        );
        if (!livestock) throw lineageError("Livestock not found", "mother", 404);
        await Livestock.updateMany({ mother: id }, { $set: { mother: null }, $inc: { __v: 1 } }, { session });
        livestock.$session(null);
        return livestock;
    });
};

export const restoreLivestock = async (id) => {
    const toRestore = await Livestock.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const propertyNumberTaken = await Livestock.findOne({
        _id: { $ne: id },
        propertyNumber: toRestore.propertyNumber,
        deletedAt: null,
    });

    if (propertyNumberTaken) {
        const conflictError = new Error("An active livestock record with this property number already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    await withLivestockLineageTransaction(async (session) => {
        toRestore.deletedAt = null;
        await validateLivestockLineage(id, toRestore.toObject(), session);
        await toRestore.save({ session });
    });
    toRestore.$session(null);
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
            status: obj.association ? "assigned" : "available",
            history: logsByLivestockId.get(key) ?? [],
        };
    });
};

export const getAvailableLivestocks = async () => {
    const livestocks = await Livestock.find({
        deletedAt: null,
        association: null,
        assignedFarmer: null,
    })
        .select("propertyNumber animal breed condition status")
        .sort({ propertyNumber: 1 });

    return livestocks;
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
}, actingUser) => {
    const access = await livestockAccessFilter(actingUser);
    const motherPopulate = { ...MOTHER_POPULATE, match: { deletedAt: null, ...access } };
    const filter = includeDeleted ? { ...access } : { deletedAt: null, ...access };
    if (condition) filter.condition = condition;
    if (status) filter.$and = [{ association: status === "assigned" ? { $ne: null } : null }];
    if (associationId && actingUser?.role !== "far") filter.association = associationId;

    if (search) {
        filter.animal = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const livestocks = await Livestock.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, motherPopulate])
            .sort({ createdAt: -1 });

        return {
            livestocks: await attachHistory(livestocks, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [livestocks, total] = await Promise.all([
        Livestock.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, motherPopulate])
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

export const getLivestock = async (id, actingUser) => {
    const access = await livestockAccessFilter(actingUser);
    const livestock = await Livestock.findOne({ _id: id, deletedAt: null, ...access })
        .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, { ...MOTHER_POPULATE, match: { deletedAt: null, ...access } }]);
    if (!livestock) throw lineageError("Livestock not found", "mother", 404);
    const [record] = await attachHistory([livestock], livestock.association?._id ?? livestock.association);
    const offspring = await Livestock.find({ mother: id, deletedAt: null, ...access })
        .select(LIVESTOCK_RELATION_FIELDS).sort({ birthDate: -1, propertyNumber: 1 }).lean();
    return { ...record, mother: record.mother ?? null, offspring: offspring.map((child) => ({ ...child, status: child.association ? "assigned" : "available" })) };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
