export const BLOCKED_CONDITIONS = {
    equipment: ["damaged", "unusable", "maintenance"],
    livestock: ["deceased", "injured", "sick"],
};

export function assignmentReason(type, condition) {
    return BLOCKED_CONDITIONS[type]?.includes(condition) ? `Not assignable: ${condition}` : "";
}
