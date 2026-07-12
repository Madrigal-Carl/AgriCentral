import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getAssociations,
    createAssociation,
    updateAssociation,
    deleteAssociation,
} from "@/services/association.service";

/* ---------------- Query Keys ---------------- */
export const associationKeys = {
    all: ["associations"],
    lists: () => [...associationKeys.all, "list"],
    list: (filters) => [...associationKeys.lists(), filters],
    details: () => [...associationKeys.all, "detail"],
    detail: (id) => [...associationKeys.details(), id],
};

/* ---------------- Queries ---------------- */
export function useAssociations(filters = {}, options = {}) {
    return useQuery({
        queryKey: associationKeys.list(filters),
        queryFn: () => getAssociations(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateAssociation(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createAssociation(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: associationKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateAssociation(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateAssociation(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: associationKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: associationKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteAssociation(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteAssociation(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: associationKeys.lists() });
            queryClient.removeQueries({ queryKey: associationKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}