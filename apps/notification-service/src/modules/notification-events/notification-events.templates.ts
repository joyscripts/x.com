import type { NotificationRequestedEvent } from "@repo/contracts";

type RenderedNotification = {
  title: string;
  body: string;
};

export function renderNotificationEvent(
  event: NotificationRequestedEvent,
): RenderedNotification {
  switch (event.templateKey) {
    case "rabbitmq_ping": {
      const message =
        typeof event.data.message === "string"
          ? event.data.message
          : "notification-service consumer is alive";

      return {
        title: "RabbitMQ ping",
        body: message,
      };
    }

    case "user_followed": {
      const actorDisplayName =
        typeof event.data.actorDisplayName === "string"
          ? event.data.actorDisplayName
          : event.actorUserId;

      return {
        title: "New follower",
        body: `${actorDisplayName} followed you`,
      };
    }

    default:
      return {
        title: event.type,
        body: `Template ${event.templateKey} is not wired yet`,
      };
  }
}
