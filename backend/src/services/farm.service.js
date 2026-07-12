import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";

const CROP_POPULATE = { path: "crops.crop" };
const FARMER_POPULATE = { path: "assignedFarmers", select: "fullName emailAddress" };

const ACTIVE_CROP_STATUSES = ["planted", "growing"];

function filterActiveCrops(farm) {
    if (!farm) return farm;
    const farmObj = typeof farm.toObject === "function" ? farm.toObject() : farm;
    farmObj.crops = (farmObj.crops ?? []).filter((c) =>
        ACTIVE_CROP_STATUSES.includes(c.status)
    );
    return farmObj;
}

export const createFarm = async (data, authenticatedUserId) => {
    const { userId, ...farmData } = data;

    const existing = await Farm.findOne({ tag: farmData.tag });

    if (existing) {
        throw new Error("A farm with this tag already exists");
    }

    const resolvedUserId = userId || authenticatedUserId;

    const farm = await Farm.create({
        ...farmData,
        user: resolvedUserId || undefined,
    });

    // A brand-new farm has no "previous" crops, so anything in crops[] here is newly assigned.
    if (farmData.crops?.length) {
        const cropIds = farmData.crops.map((c) => c.crop);
        await Crop.updateMany(
            { _id: { $in: cropIds } },
            { $set: { status: "planted" } }
        );
    }

    const populated = await farm.populate([FARMER_POPULATE, CROP_POPULATE]);
    return filterActiveCrops(populated);
};

export const updateFarm = async (id, data) => {
    if (data.tag) {
        const existing = await Farm.findOne({ tag: data.tag, _id: { $ne: id } });

        if (existing) {
            throw new Error("A farm with this tag already exists");
        }
    }

    // Grab the pre-update crop list so we can diff added vs. removed crops below.
    const previousFarm = data.crops
        ? await Farm.findById(id).select("crops.crop")
        : null;

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

    if (data.crops) {
        const newCropIds = data.crops.map((c) => c.crop.toString());
        const previousCropIds = (previousFarm?.crops ?? []).map((c) =>
            c.crop.toString()
        );

        const addedCropIds = newCropIds.filter(
            (cid) => !previousCropIds.includes(cid)
        );
        const removedCropIds = previousCropIds.filter(
            (cid) => !newCropIds.includes(cid)
        );

        if (addedCropIds.length) {
            await Crop.updateMany(
                { _id: { $in: addedCropIds } },
                { $set: { status: "planted" } }
            );
        }

        // Crop removed from this farm — free it back up so it's assignable elsewhere again.
        if (removedCropIds.length) {
            await Crop.updateMany(
                { _id: { $in: removedCropIds } },
                { $set: { status: "not_planted" } }
            );
        }
    }

    return filterActiveCrops(farm);
};

export const deleteFarm = async (id) => {
    const farm = await Farm.findByIdAndDelete(id);

    if (!farm) {
        const notFoundError = new Error("Farm not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    // Crops attached to a deleted farm are orphaned — free them back up.
    if (farm.crops?.length) {
        const cropIds = farm.crops.map((c) => c.crop);
        await Crop.updateMany(
            { _id: { $in: cropIds } },
            { $set: { status: "not_planted" } }
        );
    }

    return farm;
};

export const getFarmsByUserId = async (userId) => {
    const farms = await Farm.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate([FARMER_POPULATE, CROP_POPULATE]);

    return farms.map(filterActiveCrops);
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
            farms: farms.map(filterActiveCrops),
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
        farms: farms.map(filterActiveCrops),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}