import api from "@/api/axios";

export async function getUploadSignature({ type, fileName }) {
    const response = await api.post("/uploads/signature", { type, fileName });

    return response.data;
}

export async function uploadToCloudinary(file, type) {
    const { url, apiKey, timestamp, signature, folder, publicId } =
        await getUploadSignature({ type, fileName: file.name });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    if (publicId) formData.append("public_id", publicId);

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