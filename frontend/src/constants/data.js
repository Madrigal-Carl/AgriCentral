export const BOAC_CENTER = { lat: 13.4456, lng: 121.8403 };

// Crop stages (mirrors backend utils/cropStages.js).
export const CROP_STAGE_OPTIONS = [
    { value: "newly_planted", label: "Newly Planted" }, { value: "flowering", label: "Flowering" },
    { value: "reproductive", label: "Reproductive" }, { value: "vegetative", label: "Vegetative" },
    { value: "harvested", label: "Harvested" }, { value: "damaged", label: "Damaged" },
];
export const CROP_STAGE_LABEL = Object.fromEntries(CROP_STAGE_OPTIONS.map((o) => [o.value, o.label]));
export const CROP_STAGE_TONE = {
    newly_planted: "info", flowering: "purple", reproductive: "warning",
    vegetative: "success", harvested: "neutral", damaged: "danger",
};
export const CROP_STAGE_HEX = {
    newly_planted: "#2563eb", flowering: "#7c3aed", reproductive: "#ca8a04",
    vegetative: "#65a30d", harvested: "#166534", damaged: "#dc2626",
};
// Farm.crops[].quantities stores `planted` plus these; newly planted is derived.
export const STORED_CROP_STAGES = ["flowering", "reproductive", "vegetative", "harvested", "damaged"];
export const stageQuantityTotal = (quantities) =>
    STORED_CROP_STAGES.reduce((sum, key) => sum + (Number(quantities?.[key]) || 0), 0);
export const newlyPlantedQuantity = (quantities) =>
    Math.max(0, (Number(quantities?.planted) || 0) - stageQuantityTotal(quantities));
// Legacy mapper: stage names stored before the rename.
const LEGACY_CROP_STAGES = { planted: "newly_planted", growing: "vegetative", withered: "damaged", destroyed: "damaged" };
export const toCropStage = (value) => (value == null ? value : LEGACY_CROP_STAGES[value] ?? value);
export const cropStageLabel = (value) => CROP_STAGE_LABEL[toCropStage(value)] ?? value;

export const statusTone = {
    active: "success", inactive: "neutral", assigned: "success", reserved: "warning", available: "neutral",
    pending: "warning", approved: "info", fulfilled: "success", rejected: "danger", open: "warning", in_review: "info", resolved: "success",
};

export const GENDER_OPTIONS = [{ value: "male", label: "Male" }, { value: "female", label: "Female" }];
export const POSITION_OPTIONS = [
    { value: "president", label: "President" }, { value: "vice_president", label: "Vice President" },
    { value: "secretary", label: "Secretary" }, { value: "treasurer", label: "Treasurer" },
    { value: "auditor", label: "Auditor" }, { value: "pio", label: "PIO" },
    { value: "project_manager", label: "Project Manager" }, { value: "director", label: "Board of Directors" },
    { value: "member", label: "Member" },
];
export const condTone = { excellent: "success", good: "info", maintenance: "warning", damaged: "danger", unusable: "neutral" };
export const condLabel = { excellent: "Excellent", good: "Good", maintenance: "Maintenance", damaged: "Damaged", unusable: "Unusable" };
export const EQUIPMENT_CONDITION_OPTIONS = [
    { value: "excellent", label: "Excellent" }, { value: "good", label: "Good" }, { value: "maintenance", label: "Maintenance" },
    { value: "damaged", label: "Damaged" }, { value: "unusable", label: "Unusable" },
];
export const STATUS_OPTIONS = [{ value: "assigned", label: "Assigned" }, { value: "available", label: "Available" }];
export const healthTone = { healthy: "success", pregnant: "info", sick: "warning", deceased: "danger" };
export const LIVESTOCK_HEALTH_OPTIONS = [
    { value: "healthy", label: "Healthy" }, { value: "pregnant", label: "Pregnant" }, { value: "sick", label: "Sick" },
    { value: "injured", label: "Injured" }, { value: "deceased", label: "Deceased" },
];
// Livestock report kinds (mirrors backend utils/reportItems.js). Only
// condition reports update livestock records when approved.
export const REPORT_KIND_OPTIONS = [
    { value: "condition", label: "Condition" }, { value: "offspring", label: "Offspring" },
    { value: "redispersal", label: "Redispersal" },
];
export const REPORT_KIND_LABEL = Object.fromEntries(REPORT_KIND_OPTIONS.map((o) => [o.value, o.label]));
export const REPORT_KIND_TONE = { condition: "neutral", offspring: "success", redispersal: "purple" };
// Cause of death for deceased livestock on condition reports.
export const DECEASED_CAUSE_OPTIONS = [
    { value: "disease_asf", label: "Disease (African Swine Fever)" },
    { value: "accidental_injury", label: "Accidental Injury" },
    { value: "birth_complications", label: "Complications during Birth" },
    { value: "unknown", label: "Unknown Cause" },
];
export const DECEASED_CAUSE_LABEL = Object.fromEntries(DECEASED_CAUSE_OPTIONS.map((o) => [o.value, o.label]));
// Reported equipment usage (reporting only; not the Assigned/Available status).
export const EQUIPMENT_USAGE_OPTIONS = [{ value: "in_use", label: "In use" }, { value: "idle", label: "Idle" }];
export const EQUIPMENT_USAGE_LABEL = Object.fromEntries(EQUIPMENT_USAGE_OPTIONS.map((o) => [o.value, o.label]));
export const typeLabel = { equipment: "Equipment", livestock: "Livestock", crop: "Crop" };
export const typeTone = { equipment: "info", livestock: "warning", crop: "success" };
export const sevTone = { low: "neutral", medium: "info", high: "warning", critical: "danger" };
export const sevLabel = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
export const SEVERITY_OPTIONS = [
    { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "critical", label: "Critical" },
];
// Reports use priority (same scale as request severity above).
export const priorityTone = { low: "neutral", medium: "info", high: "warning", critical: "danger" };
export const priorityLabel = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
export const PRIORITY_OPTIONS = [
    { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "critical", label: "Critical" },
];
export const REQUEST_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" },
    { value: "fulfilled", label: "Fulfilled" }, { value: "rejected", label: "Rejected" },
];
export const TYPE_OPTIONS = [{ value: "equipment", label: "Equipment" }, { value: "livestock", label: "Livestock" }];
export const positionTone = { President: "danger", "Vice President": "warning", Secretary: "info", Treasurer: "success", Member: "neutral" };
export const roleLabel = { far: "FAR", aew: "AEW", coordinator: "Coordinator", governor: "Governor", head: "Head" };
export const roleTone = { far: "info", aew: "warning", coordinator: "success", governor: "purple", head: "danger" };
export const DEFAULT_PASSWORD = "AgriCentral@123";
export const ROLE_OPTIONS = [
    { value: "far", label: "FAR" }, { value: "aew", label: "AEW" }, { value: "coordinator", label: "Coordinator" },
    { value: "governor", label: "Governor" }, { value: "head", label: "Head" },
];
export const positionLabel = {
    president: "President", vice_president: "Vice President", secretary: "Secretary", treasurer: "Treasurer", auditor: "Auditor",
    pio: "PIO", project_manager: "Project Manager", director: "Director", member: "Member",
};
export const FARMER_CLASSIFICATION_LABEL = {
    owner: "Owner", tenant: "Tenant", lessee: "Lessee", caretaker: "Caretaker", farm_worker: "Farm Worker", co_owner: "Co-Owner", beneficiary: "Beneficiary",
};
export const LIVESTOCK_STATUS_TONES = { healthy: "bg-accent", pregnant: "bg-[#a855f7]", sick: "bg-[#f59e0b]", injured: "bg-[#ef4444]", deceased: "bg-[#94a3b8]" };
export const LIVESTOCK_STATUS_HEX = { healthy: "#00e676", pregnant: "#a855f7", sick: "#f59e0b", injured: "#ef4444", deceased: "#94a3b8" };
export const LIVESTOCK_STATUS_ORDER = ["healthy", "pregnant", "sick", "injured", "deceased"];
export const EQUIPMENT_CONDITION_TONES = { excellent: "bg-accent", good: "bg-[#3b82f6]", maintenance: "bg-[#f59e0b]", damaged: "bg-[#ef4444]", unusable: "bg-[#64748b]" };
export const EQUIPMENT_CONDITION_HEX = { excellent: "#00e676", good: "#3b82f6", maintenance: "#f59e0b", damaged: "#ef4444", unusable: "#64748b" };
export const EQUIPMENT_CONDITION_CHART_ORDER = ["excellent", "good", "maintenance", "damaged", "unusable"];
export const FARM_HARVEST_PALETTE = ["#00a86b", "#3b82f6", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#84cc16", "#f97316"];
export const ANALYTICS_CHART_COLORS = ["#166534", "#65a30d", "#ca8a04", "#dc2626", "#2563eb", "#7c3aed"];
export const ANALYTICS_PERIOD_OPTIONS = [{ value: "week", label: "This Week" }, { value: "month", label: "This Month" }, { value: "year", label: "This Year" }];
export const ANALYTICS_MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const ALL_ASSOCIATIONS_OPTION = { id: null, name: "All Associations" };
export const ALL_FARMERS_OPTION = { id: null, name: "All Farmers" };
// Analytics year filter: the current year down to 5 years back.
export const ANALYTICS_YEARS_BACK = 5;
export const analyticsYearOptions = (current = new Date().getFullYear()) =>
    Array.from({ length: ANALYTICS_YEARS_BACK + 1 }, (_, i) => ({ value: current - i, label: String(current - i) }));
