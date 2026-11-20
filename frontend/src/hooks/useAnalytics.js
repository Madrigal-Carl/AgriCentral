import { useQuery } from "@tanstack/react-query";
import {
    getAnalytics,
    getAnalyticsFarmers,
    getOverview,
    exportAnalyticsPdf,
    exportAnalyticsExcel,
} from "@/services/analytics.service";

/* ---------------- Query Keys ---------------- */
export const analyticsKeys = {
    all: ["analytics"],
    // filters carries period, year and the optional association and farmer.
    data: (filters) => [...analyticsKeys.all, filters],
    farmers: (associationId) => [...analyticsKeys.all, "farmers", associationId ?? "all"],
};

export const overviewKeys = {
    all: ["overview"],
    data: (filters) => [...overviewKeys.all, filters],
};

/* ---------------- Queries ---------------- */
export function useAnalytics(filters = {}, options = {}) {
    return useQuery({
        queryKey: analyticsKeys.data(filters),
        queryFn: () => getAnalytics(filters),
        keepPreviousData: true,
        ...options,
    });
}

// Farmers for the analytics farmer filter: the association's farmers when
// one is selected, all farmers otherwise.
export function useAnalyticsFarmers(associationId, options = {}) {
    return useQuery({
        queryKey: analyticsKeys.farmers(associationId),
        queryFn: () => getAnalyticsFarmers(associationId ? { association: associationId } : {}),
        ...options,
    });
}

export function useOverview(filters = {}, options = {}) {
    return useQuery({
        queryKey: overviewKeys.data(filters),
        queryFn: () => getOverview(filters),
        ...options,
    });
}

/* ---------------- Export helpers ---------------- */
export async function downloadAnalyticsPdf(filters, section) {
    const blob = await exportAnalyticsPdf({ ...filters, section });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agricentral-${section}-${filters.year ?? ""}-report.pdf`.replace("--", "-");
    a.click();
    URL.revokeObjectURL(url);
}

export async function downloadAnalyticsExcel(filters, section) {
    const blob = await exportAnalyticsExcel({ ...filters, section });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agricentral-${section}-${filters.year ?? ""}-report.xlsx`.replace("--", "-");
    a.click();
    URL.revokeObjectURL(url);
}