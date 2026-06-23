import type { InAppNotification } from "@repo/contracts";
import type { NotificationRow } from "@/db/schema";

export function toInAppNotificationDto(
  notification: NotificationRow,
): InAppNotification {
  return {
    notificationId: notification.notificationId,
    eventId: notification.eventId,
    recipientUserId: notification.recipientUserId,
    actorUserId: notification.actorUserId,
    type: notification.type,
    templateKey: notification.templateKey,
    entityType: notification.entityType,
    entityId: notification.entityId,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
