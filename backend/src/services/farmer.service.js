import Farmer from "../models/farmer.model.js";
import Farm from "../models/farm.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import { createLog, humanize } from "./log.service.js";

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

    await createLog({
        entityType: "farmer",
        entityId: farmer._id,
        association: farmer.association,
        message: `${farmer.fullName} was registered as a new farmer.`,
    });

    if (farmer.association) {
        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: farmer.association,
            message: `${farmer.fullName} was assigned to an association.`,
        });
    }

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

    // Snapshot the fields we diff against after the update, so we only log
    // changes that actually happened (not just fields that were resent
    // with the same value).
    const needsPrevious =
        farmerData.association !== undefined || farmerData.position !== undefined;
    const previousFarmer = needsPrevious
        ? await Farmer.findById(id).select("association position fullName")
        : null;

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

    // Association changed (assigned, reassigned, or cleared).
    if (
        farmerData.association !== undefined &&
        String(previousFarmer?.association ?? "") !== String(farmer.association ?? "")
    ) {
        if (farmer.association) {
            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: farmer.association,
                message: `${farmer.fullName} was assigned to an association.`,
            });
        } else {
            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: previousFarmer?.association,
                message: `${farmer.fullName} was removed from their association.`,
            });
        }
    }

    // Position changed.
    if (
        farmerData.position !== undefined &&
        previousFarmer?.position !== farmer.position
    ) {
        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: farmer.association,
            message: `${farmer.fullName}'s position changed from ${humanize(previousFarmer?.position)} to ${humanize(farmer.position)}.`,
        });
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

// Attaches each farmer's related records — farms, and (once those models
// exist) livestock/equipment — as full lightweight objects rather than
// just a count, so the frontend can list them, not just tally them.
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
    // those models exist.

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