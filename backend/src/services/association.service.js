import mongoose from "mongoose";
import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";

export const createAssociation = async (data) => {
    const existing = await Association.findOne({
        name: new RegExp(`^${escapeRegex(data.name.trim())}$`, "i"),
        deletedAt: null,
    });

    if (existing) {
        const conflictError = new Error("Association already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    const association = await Association.create(data);
    return association;
};

export const updateAssociation = async (id, data) => {
    const association = await Association.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: data },
        { returnDocument: "after", runValidators: true }
    );

    if (!association) {
        const notFoundError = new Error("Association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return association;
};

export const deleteAssociation = async (id) => {
    const association = await Association.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() }, $unset: { user: "" } },
        { returnDocument: "after" }
    );

    if (!association) {
        const notFoundError = new Error("Association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await Farmer.updateMany(
        { association: association._id },
        { $set: { association: null } },
    );

    return association;
};

export const restoreAssociation = async (id) => {
    // Restoring can collide with an active association that has since
    // taken the same name, so guard against that up front.
    const toRestore = await Association.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const nameTaken = await Association.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${escapeRegex(toRestore.name.trim())}$`, "i"),
        deletedAt: null,
    });

    if (nameTaken) {
        const conflictError = new Error("An active association with this name already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachMembers = async (associations) => {
    const associationIds = associations.map((a) => a._id);

    const userIds = associations
        .map((a) => a.user)
        .filter(Boolean)
        .map((u) => u.toString());

    // FAR user for each association, keyed by user id — the association
    // now points at its user directly, so we just resolve those ids.
    const farUsers = await User.find({
        _id: { $in: userIds },
        role: "far",
    }).select("_id fullname");

    const farUserById = new Map();
    for (const u of farUsers) {
        farUserById.set(u._id.toString(), u);
    }

    const farmers = await Farmer.find({
        association: { $in: associationIds },
    }).select("firstName lastName position association");

    const membersByAssociationId = new Map();
    for (const farmer of farmers) {
        const key = farmer.association?.toString();
        if (!key) continue;
        if (!membersByAssociationId.has(key)) membersByAssociationId.set(key, []);
        membersByAssociationId.get(key).push({
            name: farmer.getFullName(),
            position: farmer.position,
        });
    }

    return associations.map((a) => {
        const obj = typeof a.toObject === "function" ? a.toObject() : a;
        const key = obj._id.toString();
        const farUser = obj.user ? farUserById.get(obj.user.toString()) : null;
        const farmerMembers = membersByAssociationId.get(key) ?? [];

        const members = farUser
            ? [
                {
                    name: farUser.fullname,
                    position: "far",
                    userId: farUser._id,
                },
                ...farmerMembers,
            ]
            : farmerMembers;

        return {
            ...obj,
            assignedUser: farUser?._id ?? null,
            far: farUser?.fullname ?? null,
            members,
        };
    });
};

export const getAssociations = async ({ search, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const associations = await Association.find(filter).sort({ createdAt: -1 });
        return {
            associations: await attachMembers(associations),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [associations, total] = await Promise.all([
        Association.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Association.countDocuments(filter),
    ]);

    return {
        associations: await attachMembers(associations),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getAvailableAssociations = async ({ includeId } = {}) => {
    const validIncludeId = mongoose.isValidObjectId(includeId) ? includeId : null;

    const filter = {
        deletedAt: null,
        $or: [
            { user: null },
            ...(validIncludeId ? [{ _id: validIncludeId }] : []),
        ],
    };

    return Association.find(filter).sort({ name: 1 });
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}