export const BLOCKED_CONDITIONS = {
    equipment: ["damaged", "unusable", "maintenance"],
    livestock: ["deceased", "injured", "sick"],
};

export function assertAssignable(type, condition) {
    if (BLOCKED_CONDITIONS[type]?.includes(condition)) {
        const error = new Error(`Not assignable: ${condition}`);
        error.statusCode = 409;
        throw error;
    }
}
