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
        { $set: { deletedAt: new Date() } },
        { returnDocument: "after" }
    );

    if (!association) {
        const notFoundError = new Error("Association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    // Detach any far user still pointing at the deleted association.
    await User.updateMany(
        { association: association._id },
        { $set: { association: null } },
    );

    // Same for farmers — leaving them pointed at a deleted association
    // would break attachMembers' lookups and any association-scoped views.
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

    // FAR user per association, for the "far" display field.
    const farUsers = await User.find({
        role: "far",
        association: { $in: associationIds },
    }).select("_id fullname association");

    const farUserByAssociationId = new Map();
    for (const u of farUsers) {
        farUserByAssociationId.set(u.association.toString(), u);
    }

    // Farmers directly linked to the association.
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
        const farUser = farUserByAssociationId.get(key);
        const farmerMembers = membersByAssociationId.get(key) ?? [];

        // The FAR user is a member of the association too, not just the farmers.
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

// Associations with no far user currently pointing at them — i.e. free to
// be linked. includeId keeps the current selection visible in edit mode
// even though it's technically claimed (by the user being edited).
export const getAvailableAssociations = async ({ includeId } = {}) => {
    const validIncludeId = mongoose.isValidObjectId(includeId) ? includeId : null;

    const claimedIds = await User.find({
        role: "far",
        association: { $ne: null },
    }).distinct("association");

    const filter = {
        deletedAt: null,
        $or: [
            { _id: { $nin: claimedIds } },
            ...(validIncludeId ? [{ _id: validIncludeId }] : []),
        ],
    };

    return Association.find(filter).sort({ name: 1 });
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}