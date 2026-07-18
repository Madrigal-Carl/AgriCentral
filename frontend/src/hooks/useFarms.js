import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getFarms,
    createFarm,
    updateFarm,
    deleteFarm,
} from "@/services/farm.service";
import { farmerKeys } from "./useFarmers";

/* ---------------- Query Keys ---------------- */
export const farmKeys = {
    all: ["farms"],
    lists: () => [...farmKeys.all, "list"],
    list: (filters) => [...farmKeys.lists(), filters],
};

/* ---------------- Queries ---------------- */
export function useFarms(filters = {}, options = {}) {
    return useQuery({
        queryKey: farmKeys.list(filters),
        queryFn: () => getFarms(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateFarm(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createFarm(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
            (variables.assignedFarmers ?? []).forEach((a) => {
                queryClient.invalidateQueries({ queryKey: farmerKeys.crops(a.farmer) });
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateFarm(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateFarm(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
            (variables.assignedFarmers ?? []).forEach((a) => {
                queryClient.invalidateQueries({ queryKey: farmerKeys.crops(a.farmer) });
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteFarm(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteFarm(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}