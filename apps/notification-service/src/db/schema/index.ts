import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const deviceInstallations = pgTable("device_installations", {
  installationId: text("installation_id").primaryKey(),
  userId: text("user_id"),
  platform: text("platform").notNull(),
  pushProvider: text("push_provider").notNull(),
  deviceToken: text("device_token").notNull(),
  appVariant: text("app_variant").notNull(),
  appVersion: text("app_version"),
  deviceName: text("device_name"),
  deviceModel: text("device_model"),
  osVersion: text("os_version"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastRegisteredAt: timestamp("last_registered_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable("notifications", {
  notificationId: uuid("notification_id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().unique(),
  recipientUserId: text("recipient_user_id").notNull(),
  actorUserId: text("actor_user_id").notNull(),
  type: text("type").notNull(),
  templateKey: text("template_key").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  deliveryId: uuid("delivery_id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  notificationId: uuid("notification_id"),
  recipientUserId: text("recipient_user_id").notNull(),
  channel: text("channel").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  detail: text("detail"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type DeviceInstallationRow = typeof deviceInstallations.$inferSelect;
export type NewDeviceInstallationRow = typeof deviceInstallations.$inferInsert;
export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
export type NotificationDeliveryRow =
  typeof notificationDeliveries.$inferSelect;
export type NewNotificationDeliveryRow =
  typeof notificationDeliveries.$inferInsert;
