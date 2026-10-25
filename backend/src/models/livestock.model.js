import mongoose from "mongoose";

const livestockSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        propertyNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        animalType: { type: mongoose.Schema.Types.ObjectId, ref: "AnimalType", required: true },
        animal: {
            type: String,
            trim: true,
        },
        breed: { type: mongoose.Schema.Types.ObjectId, ref: "Breed", required: true },
        legacyMaintenance: { type: mongoose.Schema.Types.Mixed, select: false },
        gender: {
            type: String,
            enum: [
                "male",
                "female",
            ],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        color: { type: mongoose.Schema.Types.ObjectId, ref: "Color", required: true },
        weight: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        condition: {
            type: String,
            enum: [
                "healthy",
                "pregnant",
                "sick",
                "injured",
                "deceased",
            ],
            default: "healthy",
        },
        deceasedAt: { type: Date, default: null },
        status: {
            type: String,
            enum: [
                "assigned",
                "available",
            ],
            default: "available",
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        mother: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Livestock",
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        reservedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

livestockSchema.pre("validate", function () {
    this.status = this.association ? "assigned" : "available";
    this.deceasedAt = this.condition === "deceased" ? this.deceasedAt ?? new Date() : null;
});

livestockSchema.index(
    { mother: 1, deletedAt: 1 }
);

livestockSchema.index(
    { propertyNumber: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Livestock", livestockSchema);
