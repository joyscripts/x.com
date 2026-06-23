import type {
  ListInAppNotificationsResponse,
  MarkInAppNotificationReadResponse,
} from "@repo/contracts";
import { toInAppNotificationDto } from "@/modules/notifications/notifications.mapper";
import type { NotificationsRepository } from "@/modules/notifications/notifications.repository";

export interface NotificationsServicePort {
  listForUser(userId: string): Promise<ListInAppNotificationsResponse>;
  markRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse | undefined>;
}

export class NotificationsService implements NotificationsServicePort {
  constructor(private readonly repository: NotificationsRepository) {}

  async listForUser(userId: string): Promise<ListInAppNotificationsResponse> {
    const notifications = await this.repository.listByRecipientUserId(userId);

    return {
      notifications: notifications.map(toInAppNotificationDto),
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
      notification: toInAppNotificationDto(notification),
    };
  }
}
