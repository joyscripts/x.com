import amqp, { type Channel, type ChannelModel } from "amqplib";
import type { MediaUploadedEvent } from "@repo/contracts";
import { env } from "@/config/env";
import type { MediaRepository } from "@/modules/media/media.repository";

export interface MediaEventsPublisher {
  publish(event: MediaUploadedEvent): Promise<void>;
  close?(): Promise<void>;
}

export class NoopMediaEventsPublisher implements MediaEventsPublisher {
  async publish() {
    return;
  }
}

export class RabbitMqMediaEventsPublisher implements MediaEventsPublisher {
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

  async publish(event: MediaUploadedEvent) {
    const channel = await this.getChannel();

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

export class MediaOutboxRelay {
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly repository: MediaRepository,
    private readonly publisher: MediaEventsPublisher,
    private readonly options = {
      intervalMs: env.MEDIA_OUTBOX_POLL_INTERVAL_MS,
      batchSize: env.MEDIA_OUTBOX_BATCH_SIZE,
      maxAttempts: env.MEDIA_OUTBOX_MAX_ATTEMPTS,
    },
  ) {}

  start() {
    if (this.timer) {
      return;
    }

    const drainSafely = () => {
      void this.drain().catch(() => undefined);
    };

    this.timer = setInterval(drainSafely, this.options.intervalMs);
    this.timer.unref();
    drainSafely();
  }

  async drain() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const rows = await this.repository.listPendingOutbox({
        limit: this.options.batchSize,
        maxAttempts: this.options.maxAttempts,
      });

      for (const row of rows) {
        try {
          await this.publisher.publish(row.payload as MediaUploadedEvent);
          await this.repository.markOutboxPublished(row.id);
        } catch (error) {
          await this.repository.markOutboxFailed(
            row.id,
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    } finally {
      this.running = false;
    }
  }

  async close() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    await this.publisher.close?.();
  }
}
