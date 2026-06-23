import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  userId: z.string().min(1),
});

export const markNotificationReadParamsSchema = z.object({
  notificationId: z.string().uuid(),
});
