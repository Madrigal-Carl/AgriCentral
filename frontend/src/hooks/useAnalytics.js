import { useQuery } from "@tanstack/react-query";
import { getAnalytics, exportAnalyticsPdf } from "@/services/analytics.service";

/* ---------------- Query Keys ---------------- */
export const analyticsKeys = {
    all: ["analytics"],
    data: (filters) => [...analyticsKeys.all, filters],
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

/* ---------------- PDF export ---------------- */
export async function downloadAnalyticsPdf(filters, section) {
    const blob = await exportAnalyticsPdf({ ...filters, section });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agricentral-${section}-report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}