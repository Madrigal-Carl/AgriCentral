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
        municipality: { type: String, trim: true },
        barangay: { type: String, trim: true },
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
            municipality: { $type: "string" },
            barangay: { $type: "string" },
        },
        collation: { locale: "en", strength: 2 },
    },
);

export default mongoose.model("Association", associationSchema);
