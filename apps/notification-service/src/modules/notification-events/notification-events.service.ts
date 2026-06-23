import type {
  NotificationChannel,
  NotificationRequestedEvent,
} from "@repo/contracts";
import type { NotificationChannelHandler } from "@/modules/notification-channels/notification-channel.handler";
import { resolveNotificationEvent } from "@/modules/notification-definitions/notification-definitions.registry";

type HandleNotificationEventResult = {
  matchedInstallationCount: number;
  inAppNotificationCount: number;
  pushedInstallationCount: number;
  emailedNotificationCount: number;
  smsNotificationCount: number;
};

export interface NotificationEventsServicePort {
  handleRequestedEvent(
    event: NotificationRequestedEvent,
  ): Promise<HandleNotificationEventResult>;
}

export class NotificationEventsService implements NotificationEventsServicePort {
  private readonly channelHandlers: Map<
    NotificationChannel,
    NotificationChannelHandler
  >;

  constructor(channelHandlers: NotificationChannelHandler[]) {
    this.channelHandlers = new Map(
      channelHandlers.map((handler) => [handler.channel, handler]),
    );
  }

  async handleRequestedEvent(
    event: NotificationRequestedEvent,
  ): Promise<HandleNotificationEventResult> {
    const content = resolveNotificationEvent(event);
    let notificationId: string | undefined;
    const result: HandleNotificationEventResult = {
      matchedInstallationCount: 0,
      inAppNotificationCount: 0,
      pushedInstallationCount: 0,
      emailedNotificationCount: 0,
      smsNotificationCount: 0,
    };

    const requestedChannels = [
      "in_app",
      ...event.channels.filter((channel) => channel !== "in_app"),
    ].filter(
      (channel, index, channels): channel is NotificationChannel =>
        event.channels.includes(channel as NotificationChannel) &&
        channels.indexOf(channel) === index,
    );

    for (const channel of requestedChannels) {
      const handler = this.channelHandlers.get(channel);

      if (!handler) {
        continue;
      }

      const channelResult = await handler.handle({
        event,
        content,
        notificationId,
      });

      notificationId = channelResult.notificationId ?? notificationId;
      result.matchedInstallationCount += channelResult.matchedTargetCount ?? 0;

      if (channel === "in_app") {
        result.inAppNotificationCount += channelResult.deliveredCount;
      }

      if (channel === "push") {
        result.pushedInstallationCount += channelResult.deliveredCount;
      }

      if (channel === "email") {
        result.emailedNotificationCount += channelResult.deliveredCount;
      }

      if (channel === "sms") {
        result.smsNotificationCount += channelResult.deliveredCount;
      }
    }

    return result;
  }
}
