import type {
  NotificationChannel,
  NotificationRequestedEvent,
} from "@repo/contracts";
import { db } from "@/db/client";
import {
  notificationDeliveries,
  type NotificationDeliveryRow,
} from "@/db/schema";

export type DeliveryStatus = "sent" | "skipped" | "failed";

export type RecordDeliveryInput = {
  event: NotificationRequestedEvent;
  notificationId?: string;
  channel: NotificationChannel;
  provider: string;
  status: DeliveryStatus;
  detail?: string;
};

export interface NotificationDeliveriesRepository {
  record(input: RecordDeliveryInput): Promise<NotificationDeliveryRow>;
}

export class DrizzleNotificationDeliveriesRepository implements NotificationDeliveriesRepository {
  async record(input: RecordDeliveryInput): Promise<NotificationDeliveryRow> {
    const [delivery] = await db
      .insert(notificationDeliveries)
      .values({
        eventId: input.event.eventId,
        notificationId: input.notificationId ?? null,
        recipientUserId: input.event.recipientUserId,
        channel: input.channel,
        provider: input.provider,
        status: input.status,
        detail: input.detail ?? null,
      })
      .returning();

    return delivery;
  }
}
