import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        cropType: { type: mongoose.Schema.Types.ObjectId, ref: "CropType", required: true },
        // "farmer" crops belong to a farmer, not government stock: they have
        // no association, no quantity/unplanted stock and never appear in
        // the crop inventory, distribution or availability logic.
        ownership: {
            type: String,
            enum: ["government", "farmer"],
            default: "government",
        },
        name: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        unplanted: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        isDistributed: {
            type: Boolean,
            default: false,
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

cropSchema.pre("validate", function () {
    if (this.ownership !== "farmer") return;
    if (!this.assignedFarmer) throw new Error("Farmer-owned crops require a farmer");
    this.association = undefined;
    this.quantity = 0;
    this.unplanted = 0;
    this.isDistributed = false;
});

export default mongoose.model("Crop", cropSchema);
