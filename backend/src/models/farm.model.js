import mongoose from "mongoose";

const farmCropSchema = new mongoose.Schema(
    {
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: true,
        },
        status: {
            type: String,
            enum: [
                "planted",
                "growing",
                "withered",
                "harvested",
                "destroyed",
            ],
            default: "planted",
        },
        yield: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const farmFarmerSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
            required: true,
        },
        classification: {
            type: String,
            enum: [
                "owner",
                "tenant",
                "lessee",
                "caretaker",
                "farm_worker",
                "co_owner",
                "beneficiary",
            ],
            default: "owner",
        },
    },
    {
        timestamps: true,
    }
);

const farmSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        tag: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        size: {
            type: Number,
            required: true,
            min: 0,
        },
        assignedFarmers: [farmFarmerSchema],
        crops: [farmCropSchema],
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

farmSchema.index(
    { tag: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Farm", farmSchema);