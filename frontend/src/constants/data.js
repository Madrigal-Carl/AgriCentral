export const BOAC_CENTER = { lat: 13.4456, lng: 121.8403 };

export const CROP_STATUS_TONE = { planted: "info", growing: "success", harvested: "neutral", fallow: "warning" };
export const CROP_STATUS_LABEL = { planted: "Planted", growing: "Growing", harvested: "Harvested", fallow: "Fallow" };

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
export const CROP_STATUS_OPTIONS = [
    { value: "planted", label: "Planted" }, { value: "growing", label: "Growing" },
    { value: "harvested", label: "Harvested" }, { value: "withered", label: "Withered" }, { value: "damaged", label: "Damaged" },
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
export const typeLabel = { equipment: "Equipment", livestock: "Livestock", crop: "Crop" };
export const typeTone = { equipment: "info", livestock: "warning", crop: "success" };
export const sevTone = { low: "neutral", medium: "info", high: "warning", critical: "danger" };
export const sevLabel = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
export const SEVERITY_OPTIONS = [
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
