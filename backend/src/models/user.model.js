import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            minlength: 6,
            select: false,
        },
        isVerified: {
            type: Boolean,
            default: true,
        },
        role: {
            type: String,
            enum: ["far", "aew", "coordinator", "governor", "head", "admin"],
            default: "customer",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("User", userSchema);
