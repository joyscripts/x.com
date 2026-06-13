import type { NotificationRequestedEvent } from "@repo/contracts";
import type { DeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import type {
  PushMessage,
  PushProvider,
} from "@/modules/push/expo-push.provider";
import { renderNotificationEvent } from "@/modules/notification-events/notification-events.templates";

type HandleNotificationEventResult = {
  matchedInstallationCount: number;
  pushedInstallationCount: number;
};

export interface NotificationEventsServicePort {
  handleRequestedEvent(
    event: NotificationRequestedEvent,
  ): Promise<HandleNotificationEventResult>;
}

export class NotificationEventsService
  implements NotificationEventsServicePort
{
  constructor(
    private readonly deviceInstallationRepository: Pick<
      DeviceInstallationRepository,
      "listInstallationsByUserId"
    >,
    private readonly pushProvider: PushProvider,
  ) {}

  async handleRequestedEvent(
    event: NotificationRequestedEvent,
  ): Promise<HandleNotificationEventResult> {
    const installations =
      await this.deviceInstallationRepository.listInstallationsByUserId(
        event.recipientUserId,
      );

    if (!event.channels.includes("push")) {
      return {
        matchedInstallationCount: installations.length,
        pushedInstallationCount: 0,
      };
    }

    const expoInstallations = installations.filter(
      (installation) => installation.pushProvider === "expo",
    );

    if (expoInstallations.length === 0) {
      return {
        matchedInstallationCount: installations.length,
        pushedInstallationCount: 0,
      };
    }

    const renderedNotification = renderNotificationEvent(event);
    const pushMessages: PushMessage[] = expoInstallations.map(
      (installation) => ({
        to: installation.deviceToken,
        title: renderedNotification.title,
        body: renderedNotification.body,
        data: {
          ...event.data,
          eventId: event.eventId,
          type: event.type,
          templateKey: event.templateKey,
          entityType: event.entityType,
          entityId: event.entityId,
          actorUserId: event.actorUserId,
          recipientUserId: event.recipientUserId,
        },
      }),
    );

    await this.pushProvider.send(pushMessages);

    return {
      matchedInstallationCount: installations.length,
      pushedInstallationCount: expoInstallations.length,
    };
  }
}
