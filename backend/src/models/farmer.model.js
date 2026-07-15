import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true,
        },
        publicId: {
            type: String,
            required: true,
            trim: true,
        },
        resourceType: {
            type: String,
            enum: ["image", "raw", "video"],
            default: "image",
        },
    },
    { _id: false },
);

const farmerSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        middleName: {
            type: String,
            trim: true,
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
        emailAddress: {
            type: String,
            trim: true,
            lowercase: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        position: {
            type: String,
            enum: [
                "president",
                "vice_president",
                "secretary",
                "treasurer",
                "auditor",
                "pio",
                "project_manager",
                "director",
                "member",
            ],
            default: "member",
        },
        attachments: [attachmentSchema],
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Builds a full name from any object/document that has firstName/lastName.
// Static so it can be reused with partial docs (e.g. .select("firstName lastName"))
// or plain objects, not just full Farmer instances.
farmerSchema.statics.buildFullName = function (source = {}) {
    const firstName = source.firstName?.trim();
    const lastName = source.lastName?.trim();
    return [firstName, lastName].filter(Boolean).join(" ");
};

// Instance convenience method, e.g. farmer.getFullName()
farmerSchema.methods.getFullName = function () {
    return this.constructor.buildFullName(this);
};

// Virtual so farmer.fullName / JSON responses expose it automatically
farmerSchema.virtual("fullName").get(function () {
    return this.constructor.buildFullName(this);
});

const Farmer = mongoose.model("Farmer", farmerSchema);

export default Farmer;