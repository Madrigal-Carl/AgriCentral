import { z } from "zod";

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const getNotificationsQuerySchema = z.object({
    unread: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const notificationIdParamSchema = z.object({
    id: objectId("Invalid notification id"),
});
