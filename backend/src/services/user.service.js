import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Association from "../models/association.model.js"; // adjust path if your model file is named differently

const SALT_ROUNDS = 10;

const syncAssociationAssignment = async (user, associationId) => {
    if (user.role !== "far") {
        await Association.updateMany(
            { assignedUser: user._id },
            { $unset: { assignedUser: "" } },
        );
        return;
    }

    await Association.updateMany(
        { assignedUser: user._id, _id: { $ne: associationId ?? null } },
        { $unset: { assignedUser: "" } },
    );

    if (associationId) {
        await Association.findByIdAndUpdate(associationId, {
            $set: { assignedUser: user._id },
        });
    }
};

export const createUser = async (data) => {
    const { password, association, ...rest } = data;

    const existing = await User.findOne({ email: rest.email });

    if (existing) {
        throw new Error("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        ...rest,
        password: hashedPassword,
    });

    await syncAssociationAssignment(user, association);

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

    const updateData = { ...rest };

    // Only touch the password field if the caller actually sent one.
    if (password) {
        updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
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

    // Only touch association links when the caller actually sent the
    // field — an edit that doesn't mention association at all (e.g. just
    // renaming the user) shouldn't unassign anything.
    if (Object.prototype.hasOwnProperty.call(data, "association") || rest.role) {
        await syncAssociationAssignment(user, association);
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

    // Don't leave an association pointing at a user that no longer exists.
    await Association.updateMany(
        { assignedUser: user._id },
        { $unset: { assignedUser: "" } },
    );

    return user;
};

const attachAssociationInfo = async (users) => {
    const farUserIds = users
        .filter((u) => u.role === "far")
        .map((u) => u._id);

    if (!farUserIds.length) {
        return users.map((u) => (typeof u.toObject === "function" ? u.toObject() : u));
    }

    const associations = await Association.find({
        assignedUser: { $in: farUserIds },
    }).select("_id name assignedUser");

    const byUserId = new Map();
    for (const assoc of associations) {
        byUserId.set(assoc.assignedUser.toString(), {
            id: assoc._id,
            name: assoc.name,
        });
    }

    return users.map((u) => {
        const obj = typeof u.toObject === "function" ? u.toObject() : u;
        const match = byUserId.get(obj._id.toString());
        return {
            ...obj,
            ...(match
                ? { association: match.id, associationName: match.name }
                : {}),
        };
    });
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
            users: await attachAssociationInfo(users),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    return {
        users: await attachAssociationInfo(users),
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