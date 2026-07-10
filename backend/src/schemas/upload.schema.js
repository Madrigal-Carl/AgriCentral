import { z } from "zod";

export const uploadSignatureSchema = z.object({
    type: z.enum(["farmer", "report"], {
        required_error: "Upload type is required",
        invalid_type_error: "Type must be either 'farmer' or 'report'",
    }),
    fileName: z.string().trim().min(1, "File name is required").optional(),
});