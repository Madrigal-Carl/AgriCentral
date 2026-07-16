import Request from "../models/request.model.js";

export const wipeRequests = async () => {
    const result = await Request.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} request(s).`);
};

// Intentionally a no-op for now — actual request generation logic will
// be filled in later. Returning { requests: [] } keeps the shape
// consistent with every other seeder's context contribution, so nothing
// downstream breaks if a future seeder ever expects requests in context.
export const seedRequests = async () => {
    console.log("  Skipping request seeding (not yet implemented).");
    return { requests: [] };
};