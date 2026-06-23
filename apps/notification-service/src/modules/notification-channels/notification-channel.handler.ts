import type {
  NotificationChannel,
  NotificationRequestedEvent,
} from "@repo/contracts";
import type { ResolvedNotification } from "@/modules/notification-definitions/notification-definition";

export type NotificationChannelContext = {
  event: NotificationRequestedEvent;
  content: ResolvedNotification;
  notificationId?: string;
};

export type NotificationChannelResult = {
  channel: NotificationChannel;
  deliveredCount: number;
  matchedTargetCount?: number;
  notificationId?: string;
};

export interface NotificationChannelHandler {
  readonly channel: NotificationChannel;
  handle(
    context: NotificationChannelContext,
  ): Promise<NotificationChannelResult>;
}
