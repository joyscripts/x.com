import type { NotificationChannelHandler } from "@/modules/notification-channels/notification-channel.handler";
import type { NotificationDeliveriesRepository } from "@/modules/notification-deliveries/notification-deliveries.repository";
import type { NotificationsRepository } from "@/modules/notifications/notifications.repository";

export class InAppChannelHandler implements NotificationChannelHandler {
  readonly channel = "in_app" as const;

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly deliveriesRepository: NotificationDeliveriesRepository,
  ) {}

  async handle(context: Parameters<NotificationChannelHandler["handle"]>[0]) {
    const notification = await this.notificationsRepository.createFromEvent({
      event: context.event,
      content: context.content,
    });

    await this.deliveriesRepository.record({
      event: context.event,
      notificationId: notification.notificationId,
      channel: this.channel,
      provider: "local",
      status: "sent",
      detail: "Stored in-app notification",
    });

    return {
      channel: this.channel,
      deliveredCount: 1,
      notificationId: notification.notificationId,
    };
  }
}
