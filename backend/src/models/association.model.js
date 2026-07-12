import mongoose from "mongoose";

const associationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Association", associationSchema);