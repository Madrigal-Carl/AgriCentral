import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getRequests,
    createRequest,
    updateRequest,
    updateRequestApproval,
    revertRequestApproval,
    releaseRequest,
    deleteRequest,
} from "@/services/request.service";
import { uploadToCloudinary } from "@/services/upload.service";
import { equipmentKeys } from "@/hooks/useEquipments";
import { livestockKeys } from "@/hooks/useLivestocks";

/* ---------------- Query Keys ---------------- */
export const requestKeys = {
    all: ["requests"],
    lists: () => [...requestKeys.all, "list"],
    list: (filters) => [...requestKeys.lists(), filters],
    details: () => [...requestKeys.all, "detail"],
    detail: (id) => [...requestKeys.details(), id],
};

/* ---------------- Shared: files -> attachments ---------------- */
// Same pattern as useReports: keep already-uploaded files, upload new ones.
async function resolveAttachments(files = []) {
    const existingAttachments = files.filter(
        (f) => f && typeof f === "object" && !(f?.file instanceof File),
    );
    const newFiles = files.filter((f) => f?.file instanceof File);

    if (!newFiles.length) return existingAttachments;

    const uploads = await Promise.all(
        newFiles.map((f) => uploadToCloudinary(f.file, "request"))
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
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
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
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
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
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
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
        // Release images are uploaded first, then sent as attachments.
        mutationFn: async ({ id, files }) => {
            const attachments = await resolveAttachments(files);
            return releaseRequest(id, { attachments });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables.id),
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

export function useRevertRequestApproval(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => revertRequestApproval(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      queryClient.invalidateQueries({ queryKey: livestockKeys.all });
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.id) });
      options.onSuccess?.(data, variables, context);
    },
    onError: options.onError,
  });
}
