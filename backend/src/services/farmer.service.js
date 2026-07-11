import Farmer from "../models/farmer.model.js";

export const createFarmer = async (data, authenticatedUserId) => {
    const { userId, ...farmerData } = data;

    const existing = await Farmer.findOne({ emailAddress: farmerData.emailAddress });

    if (existing) {
        throw new Error("A farmer with this email already exists");
    }

    const resolvedUserId = userId || authenticatedUserId;

    const farmer = await Farmer.create({
        ...farmerData,
        user: resolvedUserId || undefined,
    });

    return farmer;
};

export const updateFarmer = async (id, data) => {
    if (data.emailAddress) {
        const existing = await Farmer.findOne({
            emailAddress: data.emailAddress,
            _id: { $ne: id },
        });

        if (existing) {
            throw new Error("A farmer with this email already exists");
        }
    }

    const farmer = await Farmer.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return farmer;
};

export const deleteFarmer = async (id) => {
    const farmer = await Farmer.findByIdAndDelete(id);

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return farmer;
};

export const getFarmersByUserId = async (userId) => {
    const farmers = await Farmer.find({ user: userId }).sort({ createdAt: -1 });
    return farmers;
};

export const getFarmers = async ({ status, search, all, page, limit }) => {
    const filter = {};
    if (status) filter.status = status;

    if (search) {
        filter.fullName = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const farmers = await Farmer.find(filter).sort({ createdAt: -1 });
        return {
            farmers,
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farmers, total] = await Promise.all([
        Farmer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Farmer.countDocuments(filter),
    ]);

    return {
        farmers,
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