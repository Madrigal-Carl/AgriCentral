export const getDateRange = (period) => {
    const now = new Date();
    let start;
    let periodEnd;

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