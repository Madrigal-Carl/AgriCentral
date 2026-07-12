import Farm from "../models/farm.model.js";

const CROP_POPULATE = { path: "crops.crop" };
const FARMER_POPULATE = { path: "assignedFarmers", select: "fullName emailAddress" };

export const createFarm = async (data) => {
    const existing = await Farm.findOne({ tag: data.tag });

    if (existing) {
        throw new Error("A farm with this tag already exists");
    }

    const farm = await Farm.create(data);

    return farm.populate([FARMER_POPULATE, CROP_POPULATE]);
};

export const updateFarm = async (id, data) => {
    if (data.tag) {
        const existing = await Farm.findOne({ tag: data.tag, _id: { $ne: id } });

        if (existing) {
            throw new Error("A farm with this tag already exists");
        }
    }

    const farm = await Farm.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    ).populate([FARMER_POPULATE, CROP_POPULATE]);

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return farm;
};

export const deleteFarm = async (id) => {
    const farm = await Farm.findByIdAndDelete(id);

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return farm;
};

export const getFarms = async ({ search, crop, userId, all, page, limit }) => {
    const filter = {};

    if (userId) filter.user = userId;

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ tag: regex }, { address: regex }];
    }

    if (crop) {
        const matchingCropIds = await Crop.find({
            name: new RegExp(escapeRegex(crop), "i"),
        }).distinct("_id");

        if (!matchingCropIds.length) {
            return all
                ? { farms: [], pagination: null }
                : {
                    farms: [],
                    pagination: { page, limit, total: 0, totalPages: 1 },
                };
        }

        filter.crops = {
            $elemMatch: {
                crop: { $in: matchingCropIds },
            },
        };
    }

    if (all) {
        const farms = await Farm.find(filter)
            .sort({ createdAt: -1 })
            .populate([FARMER_POPULATE, CROP_POPULATE]);

        return {
            farms,
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farms, total] = await Promise.all([
        Farm.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate([FARMER_POPULATE, CROP_POPULATE]),
        Farm.countDocuments(filter),
    ]);

    return {
        farms,
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