import Crop from "../models/crop.model.js";
import Farm from "../models/farm.model.js";

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

export const getCropsByFarmId = async (farmId) => {
    const farm = await Farm.findById(farmId).select("assignedFarmers crops.crop crops.status");

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const activeStatuses = ["planted", "growing"];

    const plantedOnThisFarmIds = farm.crops
        .filter((c) => activeStatuses.includes(c.status))
        .map((c) => c.crop);

    const crops = await Crop.find({
        assignedFarmer: { $in: farm.assignedFarmers },
        $or: [
            { status: "not_planted" },
            { _id: { $in: plantedOnThisFarmIds } },
        ],
    }).sort({ createdAt: -1 });

    return crops;
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