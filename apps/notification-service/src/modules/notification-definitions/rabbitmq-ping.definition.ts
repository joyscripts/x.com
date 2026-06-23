import type { NotificationDefinition } from "@/modules/notification-definitions/notification-definition";

export const rabbitmqPingDefinition: NotificationDefinition = {
  templateKey: "rabbitmq_ping",
  resolve(event) {
    const message =
      typeof event.data.message === "string"
        ? event.data.message
        : "notification-service consumer is alive";

    return {
      title: "RabbitMQ ping",
      body: message,
      data: event.data,
    };
  },
};
