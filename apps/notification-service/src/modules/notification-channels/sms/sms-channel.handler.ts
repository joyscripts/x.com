import type { NotificationChannelHandler } from "@/modules/notification-channels/notification-channel.handler";
import type { NotificationDeliveriesRepository } from "@/modules/notification-deliveries/notification-deliveries.repository";
import type { SmsProvider } from "@/modules/notification-channels/sms/sms.provider";

export class SmsChannelHandler implements NotificationChannelHandler {
  readonly channel = "sms" as const;

  constructor(
    private readonly smsProvider: SmsProvider,
    private readonly deliveriesRepository: NotificationDeliveriesRepository,
  ) {}

  async handle(context: Parameters<NotificationChannelHandler["handle"]>[0]) {
    const result = await this.smsProvider.send({
      toUserId: context.event.recipientUserId,
      body: context.content.body,
      data: context.content.data,
    });

    await this.deliveriesRepository.record({
      event: context.event,
      notificationId: context.notificationId,
      channel: this.channel,
      provider: "log-sms",
      status: "sent",
      detail: "SMS handler logged message",
    });

    return {
      channel: this.channel,
      deliveredCount: result.acceptedCount,
    };
  }
}
