import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getRequests,
    createRequest,
    updateRequest,
    updateRequestApproval,
    releaseRequest,
    deleteRequest,
} from "@/services/request.service";

/* ---------------- Query Keys ---------------- */
export const requestKeys = {
    all: ["requests"],
    lists: () => [...requestKeys.all, "list"],
    list: (filters) => [...requestKeys.lists(), filters],
    details: () => [...requestKeys.all, "detail"],
    detail: (id) => [...requestKeys.details(), id],
};

/* ---------------- Queries ---------------- */
export function useRequests(filters = {}, options = {}) {
    return useQuery({
        queryKey: requestKeys.list(filters),
        queryFn: () => getRequests(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createRequest(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateRequest(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateRequestApproval(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateRequestApproval(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useReleaseRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => releaseRequest(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteRequest(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.removeQueries({ queryKey: requestKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}