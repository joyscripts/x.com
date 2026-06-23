import type { EmailProvider } from "@/modules/notification-channels/email/email.provider";
import type { NotificationChannelHandler } from "@/modules/notification-channels/notification-channel.handler";
import type { NotificationDeliveriesRepository } from "@/modules/notification-deliveries/notification-deliveries.repository";

export class EmailChannelHandler implements NotificationChannelHandler {
  readonly channel = "email" as const;

  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly deliveriesRepository: NotificationDeliveriesRepository,
  ) {}

  async handle(context: Parameters<NotificationChannelHandler["handle"]>[0]) {
    const result = await this.emailProvider.send({
      toUserId: context.event.recipientUserId,
      subject: context.content.title,
      body: context.content.body,
      data: context.content.data,
    });

    await this.deliveriesRepository.record({
      event: context.event,
      notificationId: context.notificationId,
      channel: this.channel,
      provider: "log-email",
      status: "sent",
      detail: "Email handler logged message",
    });

    return {
      channel: this.channel,
      deliveredCount: result.acceptedCount,
    };
  }
}
