import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getReports,
    createReport,
    updateReport,
    updateReportApproval,
    deleteReport,
} from "@/services/report.service";
import { uploadToCloudinary } from "@/services/upload.service";

/* ---------------- Query Keys ---------------- */
export const reportKeys = {
    all: ["reports"],
    lists: () => [...reportKeys.all, "list"],
    list: (filters) => [...reportKeys.lists(), filters],
    details: () => [...reportKeys.all, "detail"],
    detail: (id) => [...reportKeys.details(), id],
};

/* ---------------- Shared: files -> attachments ---------------- */
async function resolveAttachments(files = []) {
    const existingAttachments = files.filter(
        (f) => f && typeof f === "object" && !(f?.file instanceof File),
    );
    const newFiles = files.filter((f) => f?.file instanceof File);

    if (!newFiles.length) return existingAttachments;

    const uploads = await Promise.all(
        newFiles.map((f) => uploadToCloudinary(f.file, "report"))
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
export function useReports(filters = {}, options = {}) {
    return useQuery({
        queryKey: reportKeys.list(filters),
        queryFn: () => getReports(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateReport(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ files, ...formValues }) => {
            const attachments = await resolveAttachments(files);
            return createReport({ ...formValues, attachments });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateReport(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, files, ...formValues }) => {
            const attachments = await resolveAttachments(files);
            return updateReport(id, { ...formValues, attachments });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: reportKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateReportApproval(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateReportApproval(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: reportKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteReport(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteReport(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
            queryClient.removeQueries({ queryKey: reportKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}