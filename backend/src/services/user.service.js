import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";

const SALT_ROUNDS = 10;

const resolveAssociation = async (role, associationId, userId) => {
    if (role !== "far" || !associationId) {
        return null;
    }

    const association = await Association.findOne({
        _id: associationId,
        deletedAt: null,
    }).select("_id user");

    if (!association) {
        const err = new Error("Association not found");
        err.statusCode = 404;
        throw err;
    }

    if (association.user && String(association.user) !== String(userId ?? "")) {
        const err = new Error("This association is already assigned to another user");
        err.statusCode = 409;
        throw err;
    }

    return associationId;
};

export const createUser = async (data) => {
    const { password, association, ...rest } = data;

    const existing = await User.findOne({ email: rest.email });

    if (existing) {
        throw new Error("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const role = rest.role ?? "far";
    const resolvedAssociationId = await resolveAssociation(role, association, null);

    const user = await User.create({
        ...rest,
        password: hashedPassword,
    });

    if (resolvedAssociationId) {
        await Association.findByIdAndUpdate(resolvedAssociationId, { $set: { user: user._id } });
    }

    return user;
};

export const updateUser = async (id, data) => {
    const { password, association, ...rest } = data;

    if (rest.email) {
        const existing = await User.findOne({
            email: rest.email,
            _id: { $ne: id },
        });

        if (existing) {
            throw new Error("A user with this email already exists");
        }
    }

    const existingUser = await User.findById(id).select("role isVerified email fullname");

    if (!existingUser) {
        const notFoundError = new Error("User not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const updateData = { ...rest };

    if (password) {
        updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const touchesAssociation =
        Object.prototype.hasOwnProperty.call(data, "association") || rest.role;

    let resolvedAssociationId;
    if (touchesAssociation) {
        const role = rest.role ?? existingUser.role;
        resolvedAssociationId = await resolveAssociation(role, association, id);
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    );

    if (!user) {
        const notFoundError = new Error("User not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (touchesAssociation) {
        await Association.updateMany(
            {
                user: id,
                ...(resolvedAssociationId ? { _id: { $ne: resolvedAssociationId } } : {}),
            },
            { $unset: { user: "" } },
        );

        if (resolvedAssociationId) {
            await Association.findByIdAndUpdate(resolvedAssociationId, { $set: { user: id } });
        }
    }

    const resolvedRole = rest.role ?? existingUser.role;
    const justVerified =
        data.isVerified === true && existingUser.isVerified !== true;

    if (justVerified && resolvedRole === "far") {
        await emailQueue.add(EMAIL_JOBS.ACCOUNT_APPROVED, {
            type: EMAIL_JOBS.ACCOUNT_APPROVED,
            data: {
                to: user.email,
                name: user.fullname,
            },
        });
    }

    return user;
};

export const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
        const notFoundError = new Error("User not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await Association.updateMany({ user: id }, { $unset: { user: "" } });

    return user;
};

export const getUsers = async ({ role, search, all, page, limit }) => {
    const filter = { role: { $ne: "admin" } };

    if (role) filter.role = role;

    if (search) {
        filter.$or = [
            { fullname: new RegExp(escapeRegex(search), "i") },
            { email: new RegExp(escapeRegex(search), "i") },
        ];
    }

    if (all) {
        const users = await User.find(filter).sort({ createdAt: -1 });
        return {
            users: await attachAssociations(users),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    return {
        users: await attachAssociations(users),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

const attachAssociations = async (users) => {
    const userIds = users.map((u) => u._id);

    const associations = await Association.find({
        user: { $in: userIds },
        deletedAt: null,
    }).select("_id name user");

    const associationByUserId = new Map();
    for (const a of associations) {
        associationByUserId.set(a.user.toString(), a);
    }

    return users.map((u) => {
        const obj = u.toObject();
        const key = obj._id.toString();
        const association = associationByUserId.get(key);
        return {
            ...obj,
            association: association?._id ?? null,
            associationName: association?.name ?? null,
        };
    });
};

function formatUser(u) {
    const obj = u.toObject();
    const { association, ...rest } = obj;
    return {
        ...rest,
        association: association?._id ?? null,
        associationName: association?.name ?? null,
    };
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}