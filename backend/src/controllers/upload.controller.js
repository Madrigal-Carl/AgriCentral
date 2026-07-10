import { createUploadSignature } from "../services/upload.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUploadSignature = asyncHandler(async (req, res) => {
    const signaturePayload = createUploadSignature(req.body);

    return res.json({
        message: "Upload signature generated",
        ...signaturePayload,
    });
});