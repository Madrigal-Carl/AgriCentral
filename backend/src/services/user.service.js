import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";

const SALT_ROUNDS = 10;

// Only "far" users can hold an association, and an association can only
// be held by one far user at a time. userId is excluded from the conflict
// check so a user keeping their own current association doesn't trip it.
const resolveAssociation = async (role, associationId, userId) => {
    if (role !== "far" || !associationId) {
        return null;
    }

    const conflict = await User.findOne({
        _id: { $ne: userId ?? null },
        role: "far",
        association: associationId,
    }).select("_id");

    if (conflict) {
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
    const resolvedAssociation = await resolveAssociation(role, association, null);

    const user = await User.create({
        ...rest,
        password: hashedPassword,
        association: resolvedAssociation,
    });

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

    if (password) {
        updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Only touch association when the caller actually sent it, or the
    // role changed (e.g. switching away from "far" should clear it).
    const touchesAssociation =
        Object.prototype.hasOwnProperty.call(data, "association") || rest.role;

    if (touchesAssociation) {
        const role = rest.role ?? (await User.findById(id).select("role"))?.role;
        updateData.association = await resolveAssociation(role, association, id);
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

    return user;
};

export const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
        const notFoundError = new Error("User not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

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
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .populate("association", "name");
        return {
            users: users.map(formatUser),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("association", "name"),
        User.countDocuments(filter),
    ]);

    return {
        users: users.map(formatUser),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

// Flattens the populated association into association/associationName,
// matching the shape the frontend already expects.
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