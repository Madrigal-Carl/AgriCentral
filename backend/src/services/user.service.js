import bcrypt from "bcrypt";
import User from "../models/user.model.js";

const SALT_ROUNDS = 10;

export const createUser = async (data) => {
    const { password, ...rest } = data;

    const existing = await User.findOne({ email: rest.email });

    if (existing) {
        throw new Error("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        ...rest,
        password: hashedPassword,
    });

    return user;
};

export const updateUser = async (id, data) => {
    const { password, ...rest } = data;

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
        { new: true, runValidators: true }
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
    // Admin accounts are excluded from every listing regardless of other
    // filters — this isn't a user-facing filter option, it's a baseline
    // exclusion, so it's applied unconditionally rather than via `role`.
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
            users,
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    return {
        users,
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