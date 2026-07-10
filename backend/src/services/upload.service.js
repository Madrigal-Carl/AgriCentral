import cloudinary from "../config/cloudinary.js";

const SUBFOLDER_MAP = {
    farmer: "farmers",
    report: "reports",
};

export const createUploadSignature = ({ type, fileName }) => {
    const subfolder = SUBFOLDER_MAP[type];

    if (!subfolder) {
        throw new Error("Invalid upload type");
    }

    const rootFolder = process.env.CLOUDINARY_ROOT_FOLDER;

    if (!rootFolder) {
        throw new Error("CLOUDINARY_ROOT_FOLDER is not configured");
    }

    const folder = `${rootFolder}/${subfolder}`;
    const timestamp = Math.round(Date.now() / 1000);

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