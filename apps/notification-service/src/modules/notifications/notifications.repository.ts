import { desc, eq, sql } from "drizzle-orm";
import type { NotificationRequestedEvent } from "@repo/contracts";
import { db } from "@/db/client";
import { notifications, type NotificationRow } from "@/db/schema";
import type { ResolvedNotification } from "@/modules/notification-definitions/notification-definition";

export type CreateNotificationInput = {
  event: NotificationRequestedEvent;
  content: ResolvedNotification;
};

export interface NotificationsRepository {
  createFromEvent(input: CreateNotificationInput): Promise<NotificationRow>;
  listByRecipientUserId(userId: string): Promise<NotificationRow[]>;
  markRead(notificationId: string): Promise<NotificationRow | undefined>;
}

export class DrizzleNotificationsRepository implements NotificationsRepository {
  async createFromEvent({
    event,
    content,
  }: CreateNotificationInput): Promise<NotificationRow> {
    const [notification] = await db
      .insert(notifications)
      .values({
        eventId: event.eventId,
        recipientUserId: event.recipientUserId,
        actorUserId: event.actorUserId,
        type: event.type,
        templateKey: event.templateKey,
        entityType: event.entityType,
        entityId: event.entityId,
        title: content.title,
        body: content.body,
        data: content.data,
      })
      .onConflictDoUpdate({
        target: notifications.eventId,
        set: {
          title: content.title,
          body: content.body,
          data: content.data,
        },
      })
      .returning();

    return notification;
  }

  async listByRecipientUserId(userId: string): Promise<NotificationRow[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUserId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markRead(notificationId: string): Promise<NotificationRow | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({
        readAt: sql`coalesce(${notifications.readAt}, now())`,
      })
      .where(eq(notifications.notificationId, notificationId))
      .returning();

    return notification;
  }
}
