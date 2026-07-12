import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getFarmers,
    getFarmersByAssociationId,
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
    byAssociation: (associationId) => [...farmerKeys.all, "byAssociation", associationId],
};

/* ---------------- Shared: files -> attachments ---------------- */
async function resolveAttachments(files = []) {
    const existingAttachments = files.filter(
        (f) => f && typeof f === "object" && !(f?.file instanceof File),
    );
    const newFiles = files.filter((f) => f?.file instanceof File);

    if (!newFiles.length) return existingAttachments;

    const uploads = await Promise.all(
        newFiles.map((f) => uploadToCloudinary(f.file, "farmer"))
    );

    return [
        ...existingAttachments,
        ...uploads.map((u) => ({
            url: u.secure_url,
            publicId: u.public_id,
            resourceType: u.resource_type,
        })),
    ];
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

export function useFarmersByAssociationId(associationId, options = {}) {
    return useQuery({
        queryKey: farmerKeys.byAssociation(associationId),
        queryFn: () => getFarmersByAssociationId(associationId),
        enabled: !!associationId,
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