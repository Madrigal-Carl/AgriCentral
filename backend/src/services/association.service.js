import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";

export const createAssociation = async (data) => {
    const association = await Association.create(data);
    return association;
};

export const updateAssociation = async (id, data) => {
    const association = await Association.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
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

    return association;
};

const attachMembers = async (associations) => {
    const assignedUserIds = associations
        .map((a) => a.assignedUser)
        .filter(Boolean);

    if (!assignedUserIds.length) {
        return associations.map((a) => {
            const obj = typeof a.toObject === "function" ? a.toObject() : a;
            return { ...obj, members: [] };
        });
    }

    const farmers = await Farmer.find({
        user: { $in: assignedUserIds },
    }).select("fullName position user");

    const membersByUserId = new Map();
    for (const farmer of farmers) {
        const key = farmer.user?.toString();
        if (!key) continue;
        if (!membersByUserId.has(key)) membersByUserId.set(key, []);
        membersByUserId.get(key).push({
            name: farmer.fullName,
            position: farmer.position,
        });
    }

    return associations.map((a) => {
        const obj = typeof a.toObject === "function" ? a.toObject() : a;
        const key = obj.assignedUser?.toString();
        return {
            ...obj,
            members: key ? membersByUserId.get(key) ?? [] : [],
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

// Escapes regex special characters in user input so a search like "a.b+c"
// is treated literally instead of as a regex pattern (which could throw
// or match unintended results).
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}