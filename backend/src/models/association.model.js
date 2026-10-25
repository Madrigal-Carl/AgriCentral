import mongoose from "mongoose";

const associationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 2,
            maxlength: 100,
        },
        municipality: { type: mongoose.Schema.Types.ObjectId, ref: "Municipality", required: true },
        barangay: { type: mongoose.Schema.Types.ObjectId, ref: "Barangay", required: true },
        legacyMaintenance: { type: mongoose.Schema.Types.Mixed, select: false },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

associationSchema.index(
    { municipality: 1, barangay: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
            municipality: { $type: "objectId" },
            barangay: { $type: "objectId" },
        },
        collation: { locale: "en", strength: 2 },
    },
);

export default mongoose.model("Association", associationSchema);
