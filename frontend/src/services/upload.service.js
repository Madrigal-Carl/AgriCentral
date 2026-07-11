import api from "@/api/axios";

export async function getUploadSignature({ type }) {
    const response = await api.post("/uploads/signature", { type });
    return response.data;
}

export async function uploadToCloudinary(file, type) {
    const { url, apiKey, timestamp, signature, folder, useFilename, uniqueFilename } =
        await getUploadSignature({ type });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("use_filename", useFilename);
    formData.append("unique_filename", uniqueFilename);

    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Upload failed");
    }

    return response.json();
}