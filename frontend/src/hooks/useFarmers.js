import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getFarmers,
    getFarmerByUserId,
    createFarmer,
    updateFarmer,
    deleteFarmer,
} from "@/services/farmer.service";
import { uploadToCloudinary } from "@/services/upload.service";

/* ---------------- Query Keys ---------------- */
export const farmerKeys = {
    all: ["farmers"],
    lists: () => [...farmerKeys.all, "list"],
    list: (filters) => [...farmerKeys.lists(), filters],
    details: () => [...farmerKeys.all, "detail"],
    detail: (id) => [...farmerKeys.details(), id],
    byUser: (userId) => [...farmerKeys.all, "byUser", userId],
};

/* ---------------- Shared: files -> attachments ---------------- */
async function resolveAttachments(files = []) {
    const existingUrls = files.filter((f) => typeof f === "string");
    const newFiles = files.filter((f) => f?.file instanceof File);

    if (!newFiles.length) return existingUrls;

    const uploads = await Promise.all(
        newFiles.map((f) => uploadToCloudinary(f.file, "farmer"))
    );
    return [...existingUrls, ...uploads.map((u) => u.secure_url)];
}

/* ---------------- Queries ---------------- */
export function useFarmers(filters = {}, options = {}) {
    return useQuery({
        queryKey: farmerKeys.list(filters),
        queryFn: () => getFarmers(filters),
        keepPreviousData: true,
        ...options,
    });
}

// Fetches the farmer(s) assigned to a specific user via GET /farmers/:userId
export function useFarmerByUserId(userId, options = {}) {
    return useQuery({
        queryKey: farmerKeys.byUser(userId),
        queryFn: () => getFarmerByUserId(userId),
        enabled: !!userId,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateFarmer(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ files, ...formValues }) => {
            const attachments = await resolveAttachments(files);
            return createFarmer({ ...formValues, attachments });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateFarmer(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, files, ...formValues }) => {
            const attachments = await resolveAttachments(files);
            return updateFarmer(id, { ...formValues, attachments });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: farmerKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteFarmer(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteFarmer(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
            queryClient.removeQueries({ queryKey: farmerKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}