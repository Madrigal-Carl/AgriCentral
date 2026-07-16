import Farmer from "../models/farmer.model.js";
import Farm from "../models/farm.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Crop from "../models/crop.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import cloudinary from "../config/cloudinary.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const user = await User.findById(authenticatedUserId).select("association");
    return user?.association ?? undefined;
};

export const createFarmer = async (data, authenticatedUserId) => {
    const { associationId, ...farmerData } = data;

    if (farmerData.emailAddress) {
        const existing = await Farmer.findOne({ emailAddress: farmerData.emailAddress, deletedAt: null });

        if (existing) {
            throw new Error("A farmer with this email already exists");
        }
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
        message: `${farmer.getFullName()} was registered as a new farmer.`,
    });

    if (farmer.association) {
        const association = await Association.findById(farmer.association).select("name");

        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: farmer.association,
            message: `${farmer.getFullName()} was assigned to ${association?.name ?? "an association"}.`,
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
            deletedAt: null,
        });

        if (existing) {
            throw new Error("A farmer with this email already exists");
        }
    }

    const needsPrevious =
        farmerData.association !== undefined || farmerData.position !== undefined;
    const previousFarmer = needsPrevious
        ? await Farmer.findOne({ _id: id, deletedAt: null }).select("association position")
        : null;

    let removedAttachments = [];
    if (farmerData.attachments) {
        const existingFarmer = await Farmer.findOne({ _id: id, deletedAt: null }).select("attachments");
        if (existingFarmer) {
            const keptPublicIds = new Set(
                farmerData.attachments.map((a) => a.publicId),
            );
            removedAttachments = existingFarmer.attachments.filter(
                (a) => !keptPublicIds.has(a.publicId),
            );
        }
    }

    const farmer = await Farmer.findOneAndUpdate(
        { _id: id, deletedAt: null },
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

    if (
        farmerData.association !== undefined &&
        String(previousFarmer?.association ?? "") !== String(farmer.association ?? "")
    ) {
        if (farmer.association) {
            const association = await Association.findById(farmer.association).select("name");

            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: farmer.association,
                message: `${farmer.getFullName()} was assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            const previousAssociation = previousFarmer?.association
                ? await Association.findById(previousFarmer.association).select("name")
                : null;

            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: previousFarmer?.association,
                message: `${farmer.getFullName()} was removed from ${previousAssociation?.name ?? "their association"}.`,
            });
        }
    }

    if (
        farmerData.position !== undefined &&
        previousFarmer?.position !== farmer.position
    ) {
        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: farmer.association,
            message: `${farmer.getFullName()}'s position changed from ${humanize(previousFarmer?.position)} to ${humanize(farmer.position)}.`,
        });
    }

    return farmer;
};

export const deleteFarmer = async (id) => {
    const farmer = await Farmer.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return farmer;
};

export const restoreFarmer = async (id) => {
    const toRestore = await Farmer.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (toRestore.emailAddress) {
        const emailTaken = await Farmer.findOne({
            _id: { $ne: id },
            emailAddress: toRestore.emailAddress,
            deletedAt: null,
        });

        if (emailTaken) {
            const conflictError = new Error("An active farmer with this email already exists");
            conflictError.statusCode = 409;
            throw conflictError;
        }
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachRelatedRecords = async (farmers, associationId) => {
    const farmerIds = farmers.map((f) => f._id);

    if (!farmerIds.length) return [];

    const farms = await Farm.find({
        assignedFarmers: { $in: farmerIds },
        deletedAt: null,
    }).select("tag assignedFarmers");

    const farmsByFarmerId = new Map();
    for (const farm of farms) {
        for (const farmerId of farm.assignedFarmers) {
            const key = farmerId.toString();
            if (!farmsByFarmerId.has(key)) farmsByFarmerId.set(key, []);
            farmsByFarmerId.get(key).push({ id: farm._id, tag: farm.tag });
        }
    }

    const livestocks = await Livestock.find({
        assignedFarmer: { $in: farmerIds },
        deletedAt: null,
    }).select("tag animal breed condition status assignedFarmer");

    const livestockByFarmerId = new Map();
    for (const livestock of livestocks) {
        const key = livestock.assignedFarmer.toString();
        if (!livestockByFarmerId.has(key)) livestockByFarmerId.set(key, []);
        livestockByFarmerId.get(key).push({
            id: livestock._id,
            tag: livestock.tag,
            animal: livestock.animal,
            breed: livestock.breed,
            condition: livestock.condition,
            status: livestock.status,
        });
    }

    const equipments = await Equipment.find({
        assignedFarmer: { $in: farmerIds },
        deletedAt: null,
    }).select("tag name condition status assignedFarmer");

    const equipmentByFarmerId = new Map();
    for (const equipment of equipments) {
        const key = equipment.assignedFarmer.toString();
        if (!equipmentByFarmerId.has(key)) equipmentByFarmerId.set(key, []);
        equipmentByFarmerId.get(key).push({
            id: equipment._id,
            tag: equipment.tag,
            name: equipment.name,
            condition: equipment.condition,
            status: equipment.status,
        });
    }

    const logsByFarmerId = await getLogsForEntities("farmer", farmerIds, associationId);

    return farmers.map((f) => {
        const obj = typeof f.toObject === "function" ? f.toObject() : f;
        const key = obj._id.toString();
        return {
            ...obj,
            farms: farmsByFarmerId.get(key) ?? [],
            livestock: livestockByFarmerId.get(key) ?? [],
            equipment: equipmentByFarmerId.get(key) ?? [],
            history: logsByFarmerId.get(key) ?? [],
        };
    });
};

export const getFarmersByAssociationId = async (associationId) => {
    const farmers = await Farmer.find({ association: associationId, deletedAt: null })
        .sort({ createdAt: -1 })
        .populate("association", "name");
    return attachRelatedRecords(farmers, associationId);
};

export const getCropsByFarmerId = async (farmerId) => {
    const farmer = await Farmer.findOne({ _id: farmerId, deletedAt: null }).select("_id");

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const crops = await Crop.find({
        assignedFarmer: farmerId,
        deletedAt: null,
        isDistributed: true,
        status: "not_planted",
    })
        .populate("association", "name")
        .sort({ createdAt: -1 });

    return crops;
};

export const getFarmers = async ({ status, search, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (status) filter.status = status;
    if (associationId) filter.association = associationId;

    if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { middleName: searchRegex },
        ];
    }

    if (all) {
        const farmers = await Farmer.find(filter)
            .sort({ createdAt: -1 })
            .populate("association", "name");
        return {
            farmers: await attachRelatedRecords(farmers, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farmers, total] = await Promise.all([
        Farmer.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("association", "name"),
        Farmer.countDocuments(filter),
    ]);

    return {
        farmers: await attachRelatedRecords(farmers, associationId),
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