import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const authSessions = pgTable("auth_sessions", {
  sessionId: uuid("session_id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AuthSessionRow = typeof authSessions.$inferSelect;
export type NewAuthSessionRow = typeof authSessions.$inferInsert;
