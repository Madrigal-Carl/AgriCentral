import Log from "../models/log.model.js";

// Logging should never break the operation it's describing — if a log
// write fails, swallow it (and report to stderr) rather than throwing
// out of a create/update flow that already succeeded.
export const createLog = async ({ entityType, entityId, association, message }) => {
    try {
        await Log.create({ entityType, entityId, association, message });
    } catch (err) {
        console.error("Failed to write log:", err);
    }
};

// snake_case / lowercase enum value -> "Title Case" for readable messages,
// without depending on the frontend's label maps (kept backend-local so
// this file has no cross-layer coupling).
export const humanize = (value) =>
    (value ?? "")
        .toString()
        .split("_")
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");