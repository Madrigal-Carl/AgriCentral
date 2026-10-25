import mongoose from "mongoose";

const animalTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

animalTypeSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null }, collation: { locale: "en", strength: 2 } });

export default mongoose.model("AnimalType", animalTypeSchema);
