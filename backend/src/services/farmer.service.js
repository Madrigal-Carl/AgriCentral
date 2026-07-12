import Farmer from "../models/farmer.model.js";
import Farm from "../models/farm.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// If the caller explicitly picked an association, use it. Otherwise fall
// back to the authenticated user's own association (this is the FAR-user
// path — they don't pick an association in the form, so the farmer they
// register should land under whichever association *they* belong to).
const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

export const createFarmer = async (data, authenticatedUserId) => {
    const { associationId, ...farmerData } = data;

    const existing = await Farmer.findOne({ emailAddress: farmerData.emailAddress });

    if (existing) {
        throw new Error("A farmer with this email already exists");
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    const farmer = await Farmer.create({
        ...farmerData,
        association: resolvedAssociationId || undefined,
    });

    return farmer;
};

export const updateFarmer = async (id, data) => {
    const { associationId, ...farmerData } = data;
    if (associationId !== undefined) {
        farmerData.association = associationId;
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

const attachRelatedRecords = async (farmers) => {
    const farmerIds = farmers.map((f) => f._id);

    if (!farmerIds.length) return [];

    const farms = await Farm.find({ assignedFarmers: { $in: farmerIds } }).select(
        "tag assignedFarmers",
    );

    const farmsByFarmerId = new Map();
    for (const farm of farms) {
        for (const farmerId of farm.assignedFarmers) {
            const key = farmerId.toString();
            if (!farmsByFarmerId.has(key)) farmsByFarmerId.set(key, []);
            farmsByFarmerId.get(key).push({ id: farm._id, tag: farm.tag });
        }
    }

    // TODO: livestock, equipment — same fetch-group-attach pattern once
    // those models exist. Stubbed as empty arrays for now so the shape
    // farmers are returned in doesn't need to change again later.

    return farmers.map((f) => {
        const obj = typeof f.toObject === "function" ? f.toObject() : f;
        const key = obj._id.toString();
        return {
            ...obj,
            farms: farmsByFarmerId.get(key) ?? [],
            livestock: obj.livestock ?? [],
            equipment: obj.equipment ?? [],
        };
    });
};

export const getFarmersByAssociationId = async (associationId) => {
    const farmers = await Farmer.find({ association: associationId }).sort({
        createdAt: -1,
    });
    return attachRelatedRecords(farmers);
};

export const getFarmers = async ({ status, search, associationId, all, page, limit }) => {
    const filter = {};
    if (status) filter.status = status;
    if (associationId) filter.association = associationId;

    if (search) {
        filter.fullName = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const farmers = await Farmer.find(filter).sort({ createdAt: -1 });
        return {
            farmers: await attachRelatedRecords(farmers),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farmers, total] = await Promise.all([
        Farmer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Farmer.countDocuments(filter),
    ]);

    return {
        farmers: await attachRelatedRecords(farmers),
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