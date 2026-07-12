import mongoose from "mongoose";
import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";

export const createAssociation = async (data) => {
    const association = await Association.create(data);
    return association;
};

export const updateAssociation = async (id, data) => {
    const association = await Association.findByIdAndUpdate(
        id,
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
    const association = await Association.findByIdAndDelete(id);

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

    // Members are now farmers directly linked to the association —
    // no more hopping through User.
    const farmers = await Farmer.find({
        association: { $in: associationIds },
    }).select("fullName position association");

    const membersByAssociationId = new Map();
    for (const farmer of farmers) {
        const key = farmer.association?.toString();
        if (!key) continue;
        if (!membersByAssociationId.has(key)) membersByAssociationId.set(key, []);
        membersByAssociationId.get(key).push({
            name: farmer.fullName,
            position: farmer.position,
        });
    }

    return associations.map((a) => {
        const obj = typeof a.toObject === "function" ? a.toObject() : a;
        const key = obj._id.toString();
        const farUser = farUserByAssociationId.get(key);
        return {
            ...obj,
            assignedUser: farUser?._id ?? null,
            far: farUser?.fullname ?? null,
            members: membersByAssociationId.get(key) ?? [],
        };
    });
};

export const getAssociations = async ({ search, all, page, limit }) => {
    const filter = {};

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