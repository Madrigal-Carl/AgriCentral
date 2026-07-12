import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} from "@/services/user.service";

/* ---------------- Query Keys ---------------- */
export const userKeys = {
    all: ["users"],
    lists: () => [...userKeys.all, "list"],
    list: (filters) => [...userKeys.lists(), filters],
    details: () => [...userKeys.all, "detail"],
    detail: (id) => [...userKeys.details(), id],
};

/* ---------------- Queries ---------------- */
export function useUsers(filters = {}, options = {}) {
    return useQuery({
        queryKey: userKeys.list(filters),
        queryFn: () => getUsers(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateUser(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createUser(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateUser(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateUser(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: userKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteUser(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteUser(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.removeQueries({ queryKey: userKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}