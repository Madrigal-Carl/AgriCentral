import mongoose from "mongoose";

const breedSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    animalType: { type: mongoose.Schema.Types.ObjectId, ref: "AnimalType", required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

breedSchema.index({ animalType: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null }, collation: { locale: "en", strength: 2 } });

export default mongoose.model("Breed", breedSchema);
