import amqp from "amqplib";
import { env } from "@/config/env";

async function main() {
  const eventId = crypto.randomUUID();
  const recipientUserId =
    process.env.TEST_NOTIFICATION_RECIPIENT_USER_ID ?? "test-user";
  const exchangeName = env.NOTIFICATION_EVENTS_EXCHANGE;
  const routingKey = "rabbitmq.ping";

  const connection = await amqp.connect(env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchangeName, "topic", { durable: true });

  const event = {
    eventId,
    type: "rabbitmq.ping",
    actorUserId: "system",
    recipientUserId,
    entityType: "system",
    entityId: eventId,
    channels: ["push"],
    templateKey: "rabbitmq_ping",
    data: {
      message: "rabbitmq.ping made it through notification-service",
    },
    occurredAt: new Date().toISOString(),
  };

  channel.publish(
    exchangeName,
    routingKey,
    Buffer.from(JSON.stringify(event)),
    {
      contentType: "application/json",
      persistent: true,
    },
  );

  await channel.close();
  await connection.close();

  console.log(
    `Published ${routingKey} for recipient ${recipientUserId} with event ${eventId}`,
  );
}

void main();
