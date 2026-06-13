import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastRegisteredAt: timestamp("last_registered_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export type DeviceInstallationRow = typeof deviceInstallations.$inferSelect;
export type NewDeviceInstallationRow = typeof deviceInstallations.$inferInsert;
