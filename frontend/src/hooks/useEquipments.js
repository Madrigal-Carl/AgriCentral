import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
} from "@/services/equipment.service";

/* ---------------- Query Keys ---------------- */
export const equipmentKeys = {
    all: ["equipments"],
    lists: () => [...equipmentKeys.all, "list"],
    list: (filters) => [...equipmentKeys.lists(), filters],
    details: () => [...equipmentKeys.all, "detail"],
    detail: (id) => [...equipmentKeys.details(), id],
};

/* ---------------- Queries ---------------- */
export function useEquipments(filters = {}, options = {}) {
    return useQuery({
        queryKey: equipmentKeys.list(filters),
        queryFn: () => getEquipments(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateEquipment(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createEquipment(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateEquipment(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateEquipment(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: equipmentKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteEquipment(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteEquipment(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
            queryClient.removeQueries({ queryKey: equipmentKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}