export const currentYear = () => new Date().getFullYear();

// Week and month only make sense for the current year; any other year is
// always reported as the whole year.
export const normalizePeriod = (period, year = currentYear()) =>
    year !== currentYear() ? "year" : period;

// Jan 1 (inclusive) to Jan 1 of the next year (exclusive), for monthly charts.
export const getYearBounds = (year = currentYear()) => ({
    yearStart: new Date(year, 0, 1),
    yearEnd: new Date(year + 1, 0, 1),
});

export const getDateRange = (period, year = currentYear()) => {
    const now = new Date();
    let start;
    let periodEnd;

    // A past year spans Jan 1 to Dec 31 of that year, whatever the period.
    if (year !== now.getFullYear()) {
        start = new Date(year, 0, 1);
        periodEnd = new Date(year, 11, 31, 23, 59, 59, 999);
        return { start, end: periodEnd < now ? periodEnd : now };
    }

    switch (period) {
        case "week": {
            start = new Date(now);
            const day = start.getDay();
            const diffToMonday = day === 0 ? 6 : day - 1;
            start.setDate(start.getDate() - diffToMonday);
            start.setHours(0, 0, 0, 0);

            periodEnd = new Date(start);
            periodEnd.setDate(start.getDate() + 6);
            periodEnd.setHours(23, 59, 59, 999);
            break;
        }
        case "year":
            start = new Date(now.getFullYear(), 0, 1);
            periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case "month":
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
    }

    const end = periodEnd < now ? periodEnd : now;

    return { start, end };
};