import type {
  InAppNotification,
  ListInAppNotificationsResponse,
  MarkInAppNotificationReadResponse,
} from "@repo/contracts";
import type { NotificationRow } from "@/db/schema";
import type { NotificationsRepository } from "@/modules/notifications/notifications.repository";

export interface NotificationsServicePort {
  listForUser(userId: string): Promise<ListInAppNotificationsResponse>;
  markRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse | undefined>;
}

function toDto(notification: NotificationRow): InAppNotification {
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

export class NotificationsService implements NotificationsServicePort {
  constructor(private readonly repository: NotificationsRepository) {}

  async listForUser(userId: string): Promise<ListInAppNotificationsResponse> {
    const notifications = await this.repository.listByRecipientUserId(userId);

    return {
      notifications: notifications.map(toDto),
    };
  }

  async markRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse | undefined> {
    const notification = await this.repository.markRead(notificationId);

    if (!notification) {
      return undefined;
    }

    return {
      notification: toDto(notification),
    };
  }
}
