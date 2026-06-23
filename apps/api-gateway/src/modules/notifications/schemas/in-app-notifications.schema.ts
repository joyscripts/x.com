import {
  listInAppNotificationsResponseSchema,
  markInAppNotificationReadResponseSchema,
} from "@repo/contracts";
import { z } from "zod";

export const listInAppNotificationsQuerySchema = z.object({
  userId: z.string().min(1),
});

export const markInAppNotificationReadParamsSchema = z.object({
  notificationId: z.string().uuid(),
});

export const createListInAppNotificationsResponseSchema =
  listInAppNotificationsResponseSchema;
export const createMarkInAppNotificationReadResponseSchema =
  markInAppNotificationReadResponseSchema;
