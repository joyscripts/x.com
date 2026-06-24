import { randomUUID } from "node:crypto";
import amqp, { type Channel, type ChannelModel } from "amqplib";
import type { NotificationRequestedEvent, OtpType } from "@repo/contracts";

export interface NotificationEventsPublisher {
  publishOtpRequested(input: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }): Promise<void>;
  close?(): Promise<void>;
}

export class RabbitMqNotificationEventsPublisher
  implements NotificationEventsPublisher
{
  private connection: ChannelModel | undefined;
  private channel: Channel | undefined;

  constructor(
    private readonly rabbitmqUrl: string,
    private readonly exchangeName: string,
  ) {}

  private async getChannel() {
    if (!this.connection || !this.channel) {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeName, "topic", {
        durable: true,
      });
    }

    return this.channel;
  }

  async publishOtpRequested({
    phoneNumber,
    otpType,
    otpCode,
  }: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }) {
    const channel = await this.getChannel();
    const eventId = randomUUID();
    const event: NotificationRequestedEvent = {
      eventId,
      type: "auth.otp.requested",
      actorUserId: "auth-service",
      recipientUserId: phoneNumber,
      entityType: "auth_otp",
      entityId: eventId,
      channels: ["sms"],
      templateKey: "auth_otp",
      data: {
        phoneNumber,
        otpType,
        otpCode,
      },
      occurredAt: new Date().toISOString(),
    };

    channel.publish(
      this.exchangeName,
      event.type,
      Buffer.from(JSON.stringify(event)),
      {
        contentType: "application/json",
        persistent: true,
      },
    );
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
