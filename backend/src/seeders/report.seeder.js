import Report from "../models/report.model.js";

export const wipeReports = async () => {
    const result = await Report.deleteMany({});
    console.log(`  Wiped ${result.deletedCount} report(s).`);
};

// Intentionally a no-op for now — actual report generation logic will
// be filled in later. Returning { reports: [] } keeps the shape
// consistent with every other seeder's context contribution, so nothing
// downstream breaks if a future seeder ever expects reports in context.
export const seedReports = async () => {
    console.log("  Skipping report seeding (not yet implemented).");
    return { reports: [] };
};