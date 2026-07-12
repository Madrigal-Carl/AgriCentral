import Farmer from "../models/farmer.model.js";
import Farm from "../models/farm.model.js";
import cloudinary from "../config/cloudinary.js";

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
    const { userId, ...farmerData } = data;
    if (userId !== undefined) {
        farmerData.user = userId;
    }

    if (farmerData.emailAddress) {
        const existing = await Farmer.findOne({
            emailAddress: farmerData.emailAddress,
            _id: { $ne: id },
        });

        if (existing) {
            throw new Error("A farmer with this email already exists");
        }
    }

    let removedAttachments = [];
    if (farmerData.attachments) {
        const existingFarmer = await Farmer.findById(id).select("attachments");
        if (existingFarmer) {
            const keptPublicIds = new Set(
                farmerData.attachments.map((a) => a.publicId),
            );
            removedAttachments = existingFarmer.attachments.filter(
                (a) => !keptPublicIds.has(a.publicId),
            );
        }
    }

    const farmer = await Farmer.findByIdAndUpdate(
        id,
        { $set: farmerData },
        { new: true, runValidators: true }
    );

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (removedAttachments.length) {
        await deleteCloudinaryAttachments(removedAttachments);
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

    await deleteCloudinaryAttachments(farmer.attachments);

    return farmer;
};

const attachFarmCounts = async (farmers) => {
    const farmerIds = farmers.map((f) => f._id);

    if (!farmerIds.length) return [];

    const counts = await Farm.aggregate([
        { $match: { assignedFarmers: { $in: farmerIds } } },
        { $unwind: "$assignedFarmers" },
        { $match: { assignedFarmers: { $in: farmerIds } } },
        { $group: { _id: "$assignedFarmers", count: { $sum: 1 } } },
    ]);

    const countByFarmerId = new Map(
        counts.map((c) => [c._id.toString(), c.count]),
    );

    return farmers.map((f) => {
        const obj = typeof f.toObject === "function" ? f.toObject() : f;
        return {
            ...obj,
            farmCount: countByFarmerId.get(obj._id.toString()) ?? 0,
        };
    });
};

export const getFarmersByUserId = async (userId) => {
    const farmers = await Farmer.find({ user: userId }).sort({ createdAt: -1 });
    return attachFarmCounts(farmers);
};

export const getFarmers = async ({ status, search, userId, all, page, limit }) => {
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    if (search) {
        filter.fullName = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const farmers = await Farmer.find(filter).sort({ createdAt: -1 });
        return {
            farmers: await attachFarmCounts(farmers),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farmers, total] = await Promise.all([
        Farmer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Farmer.countDocuments(filter),
    ]);

    return {
        farmers: await attachFarmCounts(farmers),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

async function deleteCloudinaryAttachments(attachments = []) {
    if (!attachments.length) return;

    const results = await Promise.allSettled(
        attachments.map((a) =>
            cloudinary.uploader.destroy(a.publicId, {
                resource_type: a.resourceType || "image",
            }),
        ),
    );

    results.forEach((result, i) => {
        if (result.status === "rejected") {
            console.error(
                `Failed to delete Cloudinary asset ${attachments[i].publicId}:`,
                result.reason,
            );
        }
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}