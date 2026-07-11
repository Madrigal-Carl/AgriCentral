import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFarmer } from "@/services/farmer.service";
import { uploadToCloudinary } from "@/services/upload.service";

/* ---------------- Query Keys ---------------- */
export const farmerKeys = {
    all: ["farmers"],
    lists: () => [...farmerKeys.all, "list"],
    list: (filters) => [...farmerKeys.lists(), filters],
    details: () => [...farmerKeys.all, "detail"],
    detail: (id) => [...farmerKeys.details(), id],
};

/* ---------------- Shared: files -> attachments ---------------- */
// Splits a form's `files` array into already-uploaded URLs (strings)
// and new File objects, uploads the new ones, returns the merged list.
async function resolveAttachments(files = []) {
    const existingUrls = files.filter((f) => typeof f === "string");
    const newFiles = files.filter((f) => f?.file instanceof File);

    if (!newFiles.length) return existingUrls;

    const uploads = await Promise.all(
        newFiles.map((f) => uploadToCloudinary(f.file, "farmer"))
    );
    return [...existingUrls, ...uploads.map((u) => u.secure_url)];
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