import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { authSessions, type AuthSessionRow } from "@/db/schema";

export interface AuthSessionRepository {
  create(input: {
    userId: string;
    phoneNumber: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRow>;
  findActiveByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionRow | undefined>;
  findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionRow | undefined>;
  revoke(sessionId: string): Promise<void>;
  revokeActiveForUser(userId: string): Promise<void>;
}

export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  async create(input: {
    userId: string;
    phoneNumber: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    const [session] = await db.insert(authSessions).values(input).returning();

    return session;
  }

  async findActiveByRefreshTokenHash(refreshTokenHash: string) {
    const [session] = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.refreshTokenHash, refreshTokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return session;
  }

  async findByRefreshTokenHash(refreshTokenHash: string) {
    const [session] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.refreshTokenHash, refreshTokenHash))
      .limit(1);

    return session;
  }

  async revoke(sessionId: string) {
    await db
      .update(authSessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(authSessions.sessionId, sessionId));
  }

  async revokeActiveForUser(userId: string) {
    await db
      .update(authSessions)
      .set({
        revokedAt: new Date(),
      })
      .where(
        and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)),
      );
  }
}
