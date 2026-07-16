import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getLivestocks,
    getAvailableLivestocks,
    createLivestock,
    updateLivestock,
    deleteLivestock,
} from "@/services/livestock.service";

/* ---------------- Query Keys ---------------- */
export const livestockKeys = {
    all: ["livestocks"],
    lists: () => [...livestockKeys.all, "list"],
    list: (filters) => [...livestockKeys.lists(), filters],
    details: () => [...livestockKeys.all, "detail"],
    detail: (id) => [...livestockKeys.details(), id],
    available: () => [...livestockKeys.all, "available"],
};

/* ---------------- Queries ---------------- */
export function useLivestocks(filters = {}, options = {}) {
    return useQuery({
        queryKey: livestockKeys.list(filters),
        queryFn: () => getLivestocks(filters),
        keepPreviousData: true,
        ...options,
    });
}

export function useAvailableLivestocks(options = {}) {
    return useQuery({
        queryKey: livestockKeys.available(),
        queryFn: () => getAvailableLivestocks(),
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateLivestock(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createLivestock(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: livestockKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateLivestock(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateLivestock(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: livestockKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: livestockKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteLivestock(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteLivestock(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: livestockKeys.lists() });
            queryClient.removeQueries({ queryKey: livestockKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}