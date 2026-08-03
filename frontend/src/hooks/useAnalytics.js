import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/services/analytics.service";

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