// Canonical crop stage vocabulary. Mirrored in frontend constants/data.js.
export const CROP_STAGES = ["newly_planted", "flowering", "reproductive", "vegetative", "harvested", "damaged"];

export const CROP_STAGE_LABELS = {
    newly_planted: "Newly Planted",
    flowering: "Flowering",
    reproductive: "Reproductive",
    vegetative: "Vegetative",
    harvested: "Harvested",
    damaged: "Damaged",
};

// Farm.crops[].quantities stores `planted` plus these five stages. Newly
// planted is derived (planted minus the five) and never stored.
export const STORED_STAGE_KEYS = ["flowering", "reproductive", "vegetative", "harvested", "damaged"];
export const FARM_CROP_QUANTITY_KEYS = ["planted", ...STORED_STAGE_KEYS];

/* ---------------- Legacy mapper (the only place old names live) ---------------- */

const LEGACY_CROP_STAGES = {
    planted: "newly_planted",
    growing: "vegetative",
    withered: "damaged",
    destroyed: "damaged",
};

// Old Farm.crops[].quantities keys and the stored key they fold into.
export const LEGACY_FARM_QUANTITY_KEYS = { growing: "vegetative", withered: "damaged" };

// Old stage names that may still be stored on reports (read-only).
export const LEGACY_CROP_STAGE_KEYS = Object.keys(LEGACY_CROP_STAGES);

export const isLegacyCropStage = (value) => Object.hasOwn(LEGACY_CROP_STAGES, value ?? "");

// Maps any stored stage (old or new) to the canonical key.
export const toCropStage = (value) => (value == null ? value : LEGACY_CROP_STAGES[value] ?? value);

// Old destroyed reports reduced the standing count; damaged never did.
export const isLegacyDestroyedStage = (value) => value === "destroyed";

const addNullable = (a, b) => (a == null && b == null ? null : (a ?? 0) + (b ?? 0));

// Reads Farm.crops[].quantities, folding any legacy keys into the new ones.
export function readFarmCropQuantities(quantities = {}) {
    const q = quantities ?? {};
    const result = { planted: q.planted ?? null };
    for (const key of STORED_STAGE_KEYS) result[key] = q[key] ?? null;
    for (const [legacyKey, key] of Object.entries(LEGACY_FARM_QUANTITY_KEYS)) {
        result[key] = addNullable(result[key], q[legacyKey]);
    }
    return result;
}

/* ---------------- Quantity helpers ---------------- */

export const stageQuantityTotal = (quantities = {}) =>
    STORED_STAGE_KEYS.reduce((sum, key) => sum + (quantities?.[key] ?? 0), 0);

export const newlyPlantedQuantity = (quantities = {}) =>
    Math.max(0, (quantities?.planted ?? 0) - stageQuantityTotal(quantities));

// Stage holding the largest count (newly planted included); null when empty.
export function dominantCropStage(quantities = {}) {
    const counts = { newly_planted: newlyPlantedQuantity(quantities) };
    for (const key of STORED_STAGE_KEYS) counts[key] = quantities?.[key] ?? 0;
    let best = null;
    for (const stage of CROP_STAGES) {
        if (counts[stage] > 0 && (best === null || counts[stage] > counts[best])) best = stage;
    }
    return best;
}
