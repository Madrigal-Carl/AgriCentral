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
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Association", associationSchema);