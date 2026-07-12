import Crop from "../models/crop.model.js";

export const createCrop = async (data, authenticatedUserId) => {
    const { userId, ...cropData } = data;

    const resolvedUserId = userId || authenticatedUserId;

    const crop = await Crop.create({
        ...cropData,
        user: resolvedUserId || undefined,
    });

    return crop;
};

export const updateCrop = async (id, data) => {
    const crop = await Crop.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return crop;
};

export const deleteCrop = async (id) => {
    const crop = await Crop.findByIdAndDelete(id);

    if (!crop) {
        const notFoundError = new Error("Crop not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return crop;
};

export const getCropsByUserId = async (userId) => {
    const crops = await Crop.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$name" } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, name: "$_id" } },
    ]);

    return crops.map((c) => c.name);
};

export const getCrops = async ({ status, search, userId, all, page, limit }) => {
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const crops = await Crop.find(filter).sort({ createdAt: -1 });
        return {
            crops,
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [crops, total] = await Promise.all([
        Crop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Crop.countDocuments(filter),
    ]);

    return {
        crops,
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