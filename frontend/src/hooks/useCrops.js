import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getCrops,
    getCropsByUserId,
    createCrop,
    updateCrop,
    deleteCrop,
} from "@/services/crop.service";

/* ---------------- Query Keys ---------------- */
export const cropKeys = {
    all: ["crops"],
    lists: () => [...cropKeys.all, "list"],
    list: (filters) => [...cropKeys.lists(), filters],
    details: () => [...cropKeys.all, "detail"],
    detail: (id) => [...cropKeys.details(), id],
    byUser: (userId) => [...cropKeys.all, "byUser", userId],
};

/* ---------------- Queries ---------------- */
export function useCrops(filters = {}, options = {}) {
    return useQuery({
        queryKey: cropKeys.list(filters),
        queryFn: () => getCrops(filters),
        keepPreviousData: true,
        ...options,
    });
}

// Fetches the crop(s) belonging to a specific user via GET /crops/:userId
export function useCropsByUserId(userId, options = {}) {
    return useQuery({
        queryKey: cropKeys.byUser(userId),
        queryFn: () => getCropsByUserId(userId),
        enabled: !!userId,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateCrop(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createCrop(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: cropKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateCrop(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateCrop(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: cropKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: cropKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteCrop(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteCrop(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: cropKeys.lists() });
            queryClient.removeQueries({ queryKey: cropKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}