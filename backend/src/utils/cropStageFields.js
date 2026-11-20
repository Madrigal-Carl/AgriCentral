// Stage-specific crop report fields. Mirrored in frontend
// src/constants/cropStageFields.js; keep the two in sync.

export const PLANTING_METHODS = ["transplanted", "direct_seeded", "broadcast", "other"];
export const SEED_CLASSES = ["certified", "registered", "hybrid", "farmer_saved", "other"];
export const SEED_OWNERSHIPS = ["farmer", "government"];
export const CROP_CONDITIONS = ["good", "fair", "poor"];
export const QUALITY_GRADES = ["grade_a", "grade_b", "grade_c", "rejected"];
export const DISPOSITIONS = ["sold", "stored", "own_consumption"];
export const DAMAGE_REASONS = ["typhoon", "flood", "drought", "pest", "disease", "fire", "other"];
export const PRODUCTION_UNITS = ["kg", "MT"];
export const KG_PER_MT = 1000;

// The stage's main date; a crop report's reportedAt is set from it.
export const STAGE_MAIN_DATE = {
    newly_planted: "datePlanted",
    flowering: "dateStarted",
    vegetative: "dateStarted",
    reproductive: "dateObserved",
    harvested: "dateHarvested",
    damaged: "dateOccurred",
};

// The stage's area field (hectares).
export const STAGE_AREA_FIELD = {
    newly_planted: "areaPlantedHa",
    flowering: "areaHa",
    vegetative: "areaHa",
    reproductive: "areaHa",
    harvested: "areaHarvestedHa",
    damaged: "areaAffectedHa",
};

// Every field each stage may store (anything else is dropped).
export const STAGE_FIELDS = {
    newly_planted: ["datePlanted", "areaPlantedHa", "plantingMethod", "plantingMethodOther", "seedClass", "seedClassOther", "seedQuantity", "expectedHarvestDate", "seedOwnership", "expectedYieldKg"],
    flowering: ["dateStarted", "areaHa", "condition"],
    vegetative: ["dateStarted", "areaHa", "condition"],
    reproductive: ["dateObserved", "areaHa", "subStage"],
    harvested: ["dateHarvested", "areaHarvestedHa", "totalProductionValue", "totalProductionUnit", "totalProductionKg", "yieldPerHaKg", "qualityGrade", "disposition"],
    damaged: ["damageReason", "damageReasonOther", "dateOccurred", "areaAffectedHa", "estimatedLossKg", "estimatedLossPesos"],
};

/* ---------------- Reproductive sub-stages ---------------- */

export const REPRODUCTIVE_SUB_STAGES = {
    "Rice": ["Panicle Initiation", "Booting", "Heading", "Anthesis"],
    "Corn": ["Tasseling", "Silking", "Blister", "Milk", "Dough", "Dent"],
    "Coconut": ["Spathe Emergence", "Inflorescence Opening", "Nut Setting", "Nut Development"],
    "Banana (Saba)": ["Shooting", "Bunch Emergence", "Finger Filling"],
    "Cassava": ["Branching", "Flowering", "Tuber Bulking"],
    "Sweet Potato (Kamote)": ["Tuber Initiation", "Tuber Bulking"],
    "Calamansi": ["Flower Bud Initiation", "Fruit Set", "Fruit Development"],
    "Mango": ["Flower Bud Initiation", "Fruit Set", "Fruit Development"],
    "Gabi (Taro)": ["Corm Initiation", "Corm Bulking"],
    "Peanut": ["Pegging", "Pod Formation", "Pod Filling"],
    "Squash (Kalabasa)": ["Flowering", "Fruit Set", "Fruit Development"],
    "Eggplant (Talong)": ["Flowering", "Fruit Set", "Fruit Development"],
};
export const REPRODUCTIVE_SUB_STAGE_FALLBACK = ["Initiation", "Development", "Maturation"];

// "Banana (Saba)" also answers to "Banana" and "Saba" (case-insensitive).
const SUB_STAGE_LOOKUP = new Map();
for (const [name, subStages] of Object.entries(REPRODUCTIVE_SUB_STAGES)) {
    const match = name.match(/^(.*?)\s*\((.*)\)$/);
    for (const alias of match ? [name, match[1], match[2]] : [name]) {
        const key = alias.trim().toLowerCase();
        if (!SUB_STAGE_LOOKUP.has(key)) SUB_STAGE_LOOKUP.set(key, subStages);
    }
}

export const reproductiveSubStagesFor = (cropTypeName) =>
    SUB_STAGE_LOOKUP.get(String(cropTypeName ?? "").trim().toLowerCase()) ?? REPRODUCTIVE_SUB_STAGE_FALLBACK;

/* ---------------- Helpers ---------------- */

export const toProductionKg = (value, unit) => (unit === "MT" ? value * KG_PER_MT : value);

// Date inputs send calendar dates (UTC midnight). Allow the latest time zone
// (UTC+14) so "today" is never treated as the future.
const FUTURE_TOLERANCE_MS = 14 * 60 * 60 * 1000;
export const isFutureDate = (date, now = new Date()) => new Date(date).getTime() > now.getTime() + FUTURE_TOLERANCE_MS;

const isValidDate = (value) => value != null && value !== "" && Number.isFinite(new Date(value).getTime());
const isPositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
const isNonNegative = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const hasText = (value) => typeof value === "string" && value.trim().length > 0;

// Required fields and rules per stage. Returns [{ path, message }] for the
// stageData object (empty when valid). Used by the zod schemas, the report
// model and the report service so every layer enforces the same rules.
// checkFuture: false skips the "not in the future" rule (structure only).
export function validateStageData(stage, data = {}, { now = new Date(), checkFuture = true } = {}) {
    const issues = [];
    const add = (path, message) => issues.push({ path, message });
    const d = data ?? {};
    const date = (field, label, { allowFuture = false } = {}) => {
        if (!isValidDate(d[field])) add(field, `${label} is required`);
        else if (checkFuture && !allowFuture && isFutureDate(d[field], now)) add(field, `${label} cannot be in the future`);
    };
    const area = (field, label) => { if (!isPositive(d[field])) add(field, `${label} must be greater than 0 ha`); };
    const oneOf = (field, values, label) => { if (!values.includes(d[field])) add(field, `Select ${label}`); };
    const other = (field, otherField, label) => { if (d[field] === "other" && !hasText(d[otherField])) add(otherField, `Specify the ${label}`); };

    switch (stage) {
        case "newly_planted":
            date("datePlanted", "Date planted");
            area("areaPlantedHa", "Area planted");
            oneOf("plantingMethod", PLANTING_METHODS, "a planting method");
            other("plantingMethod", "plantingMethodOther", "planting method");
            oneOf("seedClass", SEED_CLASSES, "a seed class");
            other("seedClass", "seedClassOther", "seed class");
            if (!Number.isInteger(d.seedQuantity) || d.seedQuantity <= 0) add("seedQuantity", "Quantity of seeds must be a whole number greater than 0");
            date("expectedHarvestDate", "Expected harvest date", { allowFuture: true });
            if (isValidDate(d.expectedHarvestDate) && isValidDate(d.datePlanted) && new Date(d.expectedHarvestDate) <= new Date(d.datePlanted)) {
                add("expectedHarvestDate", "Expected harvest date must be after the date planted");
            }
            oneOf("seedOwnership", SEED_OWNERSHIPS, "the seed ownership");
            if (!isPositive(d.expectedYieldKg)) add("expectedYieldKg", "Expected yield must be greater than 0 kg");
            break;
        case "flowering":
        case "vegetative":
            date("dateStarted", stage === "flowering" ? "Date flowering started" : "Date vegetative started");
            area("areaHa", "Area");
            oneOf("condition", CROP_CONDITIONS, "a condition");
            break;
        case "reproductive":
            date("dateObserved", "Date observed");
            area("areaHa", "Area");
            if (!hasText(d.subStage)) add("subStage", "Select a sub-stage");
            break;
        case "harvested":
            date("dateHarvested", "Date harvested");
            area("areaHarvestedHa", "Area harvested");
            if (!isPositive(d.totalProductionValue)) add("totalProductionValue", "Total production must be greater than 0");
            oneOf("totalProductionUnit", PRODUCTION_UNITS, "a production unit");
            if (!isPositive(d.yieldPerHaKg)) add("yieldPerHaKg", "Yield per hectare must be greater than 0 kg");
            oneOf("qualityGrade", QUALITY_GRADES, "a quality grade");
            if (d.disposition != null && d.disposition !== "" && !DISPOSITIONS.includes(d.disposition)) add("disposition", "Select a valid disposition");
            break;
        case "damaged":
            oneOf("damageReason", DAMAGE_REASONS, "a damage reason");
            other("damageReason", "damageReasonOther", "damage reason");
            date("dateOccurred", "Date occurred");
            area("areaAffectedHa", "Area affected");
            for (const field of ["estimatedLossKg", "estimatedLossPesos"]) {
                if (d[field] != null && !isNonNegative(d[field])) add(field, "Estimated loss cannot be negative");
            }
            if (!isPositive(d.estimatedLossKg) && !isPositive(d.estimatedLossPesos)) {
                add("estimatedLossKg", "Enter an estimated loss in kg or pesos (at least one greater than 0)");
            }
            break;
        default:
            add("stage", "Select a crop stage");
    }
    return issues;
}

// Keeps only the stage's own fields and fills the derived ones
// (totalProductionKg from value + unit).
export function normalizeStageData(stage, data = {}) {
    const fields = STAGE_FIELDS[stage] ?? [];
    const result = {};
    for (const field of fields) {
        if (data?.[field] !== undefined && data[field] !== null && data[field] !== "") result[field] = data[field];
    }
    if (stage === "harvested" && isPositive(result.totalProductionValue)) {
        result.totalProductionKg = toProductionKg(result.totalProductionValue, result.totalProductionUnit);
    }
    if (stage === "newly_planted" && result.plantingMethod !== "other") delete result.plantingMethodOther;
    if (stage === "newly_planted" && result.seedClass !== "other") delete result.seedClassOther;
    if (stage === "damaged" && result.damageReason !== "other") delete result.damageReasonOther;
    return result;
}
