import amqp, { type Channel, type ConsumeMessage } from "amqplib";
import type { FastifyBaseLogger } from "fastify";
import type { NotificationEventsServicePort } from "@/modules/notification-events/notification-events.service";
import { createNotificationRequestedEventSchema } from "@/modules/notification-events/schemas/notification-events.schema";

type StartNotificationEventsConsumerOptions = {
  rabbitmqUrl: string;
  exchangeName: string;
  queueName: string;
  bindings: string[];
  logger: FastifyBaseLogger;
  notificationEventsService: NotificationEventsServicePort;
};

type NotificationEventsConsumerHandle = {
  close(): Promise<void>;
};

export async function startNotificationEventsConsumer({
  rabbitmqUrl,
  exchangeName,
  queueName,
  bindings,
  logger,
  notificationEventsService,
}: StartNotificationEventsConsumerOptions): Promise<NotificationEventsConsumerHandle> {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchangeName, "topic", { durable: true });
  await channel.assertQueue(queueName, { durable: true });

  for (const binding of bindings) {
    await channel.bindQueue(queueName, exchangeName, binding);
  }

  await channel.prefetch(10);

  await channel.consume(queueName, async (message) => {
    if (!message) {
      return;
    }

    await handleMessage({
      channel,
      message,
      logger,
      notificationEventsService,
    });
  });

  logger.info(
    {
      exchangeName,
      queueName,
      bindings,
    },
    "Notification events consumer started",
  );

  return {
    async close() {
      await channel.close();
      await connection.close();
    },
  };
}

type HandleMessageOptions = {
  channel: Channel;
  message: ConsumeMessage;
  logger: FastifyBaseLogger;
  notificationEventsService: NotificationEventsServicePort;
};

async function handleMessage({
  channel,
  message,
  logger,
  notificationEventsService,
}: HandleMessageOptions) {
  let parsedMessage: unknown;

  try {
    parsedMessage = JSON.parse(message.content.toString("utf8"));
  } catch (error) {
    logger.error(
      {
        error,
        content: message.content.toString("utf8"),
      },
      "Discarding notification event with invalid JSON payload",
    );
    channel.ack(message);
    return;
  }

  const parsedEvent = createNotificationRequestedEventSchema.safeParse(
    parsedMessage,
  );

  if (!parsedEvent.success) {
    logger.error(
      {
        issues: parsedEvent.error.flatten(),
        payload: parsedMessage,
      },
      "Discarding notification event with invalid shape",
    );
    channel.ack(message);
    return;
  }

  try {
    const result = await notificationEventsService.handleRequestedEvent(
      parsedEvent.data,
    );

    logger.info(
      {
        eventId: parsedEvent.data.eventId,
        type: parsedEvent.data.type,
        result,
      },
      "Notification event handled",
    );
    channel.ack(message);
  } catch (error) {
    logger.error(
      {
        error,
        eventId: parsedEvent.data.eventId,
        type: parsedEvent.data.type,
      },
      "Notification event handling failed",
    );
    channel.nack(message, false, false);
  }
}
