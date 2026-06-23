import type { NotificationRequestedEvent } from "@repo/contracts";
import type {
  NotificationDefinition,
  ResolvedNotification,
} from "@/modules/notification-definitions/notification-definition";
import { rabbitmqPingDefinition } from "@/modules/notification-definitions/rabbitmq-ping.definition";
import { userFollowedDefinition } from "@/modules/notification-definitions/user-followed.definition";

const notificationDefinitions = new Map<string, NotificationDefinition>(
  [rabbitmqPingDefinition, userFollowedDefinition].map((definition) => [
    definition.templateKey,
    definition,
  ]),
);

export function resolveNotificationEvent(
  event: NotificationRequestedEvent,
): ResolvedNotification {
  const definition = notificationDefinitions.get(event.templateKey);

  if (!definition) {
    return {
      title: event.type,
      body: `Template ${event.templateKey} is not wired yet`,
      data: event.data,
    };
  }

  return definition.resolve(event);
}
