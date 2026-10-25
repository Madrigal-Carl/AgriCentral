import mongoose from "mongoose";

const barangaySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    municipality: { type: mongoose.Schema.Types.ObjectId, ref: "Municipality", required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

barangaySchema.index({ municipality: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null }, collation: { locale: "en", strength: 2 } });

export default mongoose.model("Barangay", barangaySchema);
