// Dispersal age: an animal's age on the day it was dispersed (released to
// an association). Mirrored in frontend/src/utils/dispersal.js; keep the two
// in sync. Used by the drawers and the exports.
//
// Formats: "2 yr 3 mo", "2 yr", "8 mo", "12 days", "1 day".
// Returns "" when either date is missing/invalid or dispersal precedes birth.
const DAY_MS = 24 * 60 * 60 * 1000;

const toUtcDay = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate(), t: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) };
};

export function formatDispersalAge(birthDate, dispersedAt) {
    const born = toUtcDay(birthDate);
    const dispersed = toUtcDay(dispersedAt);
    if (!born || !dispersed || dispersed.t < born.t) return "";

    let months = (dispersed.y - born.y) * 12 + (dispersed.m - born.m);
    if (dispersed.d < born.d) months -= 1;

    if (months >= 1) {
        const years = Math.floor(months / 12);
        const rest = months % 12;
        if (!years) return `${rest} mo`;
        return rest ? `${years} yr ${rest} mo` : `${years} yr`;
    }
    const days = Math.round((dispersed.t - born.t) / DAY_MS);
    return `${days} ${days === 1 ? "day" : "days"}`;
}
