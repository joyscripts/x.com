import type { DeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import type { NotificationChannelHandler } from "@/modules/notification-channels/notification-channel.handler";
import type { PushProvider } from "@/modules/notification-channels/push/push.provider";
import type { NotificationDeliveriesRepository } from "@/modules/notification-deliveries/notification-deliveries.repository";

export class PushChannelHandler implements NotificationChannelHandler {
  readonly channel = "push" as const;

  constructor(
    private readonly deviceInstallationRepository: Pick<
      DeviceInstallationRepository,
      "listInstallationsByUserId"
    >,
    private readonly pushProvider: PushProvider,
    private readonly deliveriesRepository: NotificationDeliveriesRepository,
  ) {}

  async handle(context: Parameters<NotificationChannelHandler["handle"]>[0]) {
    const installations =
      await this.deviceInstallationRepository.listInstallationsByUserId(
        context.event.recipientUserId,
      );
    const fcmInstallations = installations.filter(
      (installation) => installation.pushProvider === "fcm",
    );

    if (fcmInstallations.length === 0) {
      await this.deliveriesRepository.record({
        event: context.event,
        notificationId: context.notificationId,
        channel: this.channel,
        provider: "fcm",
        status: "skipped",
        detail: "No FCM installations for recipient",
      });

      return {
        channel: this.channel,
        deliveredCount: 0,
        matchedTargetCount: installations.length,
      };
    }

    const deliveryResult = await this.pushProvider.send(
      fcmInstallations.map((installation) => ({
        to: installation.deviceToken,
        title: context.content.title,
        body: context.content.body,
        data: {
          ...context.content.data,
          eventId: context.event.eventId,
          type: context.event.type,
          templateKey: context.event.templateKey,
          entityType: context.event.entityType,
          entityId: context.event.entityId,
          actorUserId: context.event.actorUserId,
          recipientUserId: context.event.recipientUserId,
        },
      })),
    );

    await this.deliveriesRepository.record({
      event: context.event,
      notificationId: context.notificationId,
      channel: this.channel,
      provider: "fcm",
      status: "sent",
      detail: `Accepted ${deliveryResult.acceptedCount} of ${fcmInstallations.length} FCM messages`,
    });

    return {
      channel: this.channel,
      deliveredCount: deliveryResult.acceptedCount,
      matchedTargetCount: installations.length,
    };
  }
}
