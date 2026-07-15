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

// Auto-generates a sequential tag (FM-001, FM-002, ...) for every new
// farm, regardless of caller (API service, seeder, etc). Runs before
// validation so the required `tag` field is already populated by the time
// the required-field check happens. Scans ALL farms (not just active ones)
// so a soft-deleted farm's number is never reused.
farmSchema.pre("validate", async function () {
    if (!this.isNew || this.tag) return;

    const existing = await this.constructor
        .find({ tag: { $regex: /^FARM-\d+$/ } })
        .select("tag")
        .lean();

    const maxNumber = existing.reduce((max, doc) => {
        const match = doc.tag.match(/^FARM-(\d+)$/);
        const num = match ? parseInt(match[1], 10) : 0;
        return num > max ? num : max;
    }, 0);

    this.tag = `FARM-${String(maxNumber + 1).padStart(3, "0")}`;
});

export default mongoose.model("Farm", farmSchema);