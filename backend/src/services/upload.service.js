import cloudinary from "../config/cloudinary.js";

const FOLDER_MAP = {
    farmer: "farmers",
    report: "reports",
};

export const createUploadSignature = ({ type, fileName }) => {
    const folder = FOLDER_MAP[type];

    if (!folder) {
        throw new Error("Invalid upload type");
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Only params that will actually be sent to Cloudinary get signed.
    const paramsToSign = {
        timestamp,
        folder,
        ...(fileName ? { public_id: fileName.replace(/\.[^/.]+$/, "") } : {}),
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
    );

    return {
        url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        folder,
        ...(paramsToSign.public_id ? { publicId: paramsToSign.public_id } : {}),
    };
};