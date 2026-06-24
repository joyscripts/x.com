import { randomUUID } from "node:crypto";
import type {
  AuthRefreshTokenResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
  OtpType,
} from "@repo/contracts";
import { createApp } from "@/app";
import type { AuthSessionRow } from "@/db/schema";
import type { AuthSessionRepository } from "@/modules/auth/auth.repository";
import { AuthService } from "@/modules/auth/auth.service";
import type { NotificationEventsPublisher } from "@/modules/auth/notification-events.publisher";
import type { ConsumeOtpResult, OtpStore } from "@/modules/auth/otp.store";

class MemoryOtpStore implements OtpStore {
  public readonly records = new Map<string, string>();

  async save(input: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
    ttlSeconds: number;
  }) {
    this.records.set(`${input.otpType}:${input.phoneNumber}`, input.otpCode);
  }

  async consume(input: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }): Promise<ConsumeOtpResult> {
    const key = `${input.otpType}:${input.phoneNumber}`;
    const otpCode = this.records.get(key);

    if (!otpCode) {
      return { status: "missing" };
    }

    if (otpCode !== input.otpCode) {
      return { status: "invalid", attemptsRemaining: 4 };
    }

    this.records.delete(key);
    return { status: "valid" };
  }
}

class MemoryAuthSessionRepository implements AuthSessionRepository {
  public readonly sessions = new Map<string, AuthSessionRow>();

  async create(input: {
    userId: string;
    phoneNumber: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRow> {
    const session: AuthSessionRow = {
      sessionId: randomUUID(),
      userId: input.userId,
      phoneNumber: input.phoneNumber,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    this.sessions.set(input.refreshTokenHash, session);

    return session;
  }

  async findActiveByRefreshTokenHash(refreshTokenHash: string) {
    const session = this.sessions.get(refreshTokenHash);

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return undefined;
    }

    return session;
  }

  async revoke(sessionId: string) {
    for (const [refreshTokenHash, session] of this.sessions.entries()) {
      if (session.sessionId === sessionId) {
        this.sessions.set(refreshTokenHash, {
          ...session,
          revokedAt: new Date(),
        });
      }
    }
  }
}

class FakeNotificationEventsPublisher implements NotificationEventsPublisher {
  public readonly otpRequests: Array<{
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }> = [];

  async publishOtpRequested(input: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }) {
    this.otpRequests.push(input);
  }
}

class FakeAuthService {
  async requestOtp(
    input: AuthRequestOtpRequest,
  ): Promise<AuthRequestOtpResponse> {
    return {
      status: "otp_sent",
      phoneNumber: input.phoneNumber,
      otpType: input.otpType,
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(
    input: AuthVerifyOtpRequest,
  ): Promise<AuthVerifyOtpResponse> {
    return {
      status: "authenticated",
      session: {
        userId: "phone_test",
        phoneNumber: input.phoneNumber,
        accessToken: "access-token",
        refreshToken: "refresh-token",
        tokenType: "Bearer",
        expiresInSeconds: 900,
        refreshExpiresInSeconds: 2_592_000,
      },
    };
  }

  async refresh(): Promise<AuthRefreshTokenResponse> {
    return {
      status: "refreshed",
      session: {
        userId: "phone_test",
        phoneNumber: "+15551234567",
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        tokenType: "Bearer",
        expiresInSeconds: 900,
        refreshExpiresInSeconds: 2_592_000,
      },
    };
  }
}

describe("auth routes", () => {
  it("keeps auth routes internal to the gateway", async () => {
    const app = createApp({
      authService: new FakeAuthService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/otp/request",
      payload: {
        phoneNumber: "+15551234567",
        otpType: "signup",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("requests and verifies an OTP", async () => {
    const otpStore = new MemoryOtpStore();
    const sessionRepository = new MemoryAuthSessionRepository();
    const publisher = new FakeNotificationEventsPublisher();
    const app = createApp({
      authService: new AuthService(otpStore, sessionRepository, publisher),
    });

    const requestResponse = await app.inject({
      method: "POST",
      url: "/auth/otp/request",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        phoneNumber: "+15551234567",
        otpType: "signup",
      },
    });

    expect(requestResponse.statusCode).toBe(202);
    expect(requestResponse.json()).toMatchObject({
      status: "otp_sent",
      expiresInSeconds: 600,
    });
    expect(publisher.otpRequests).toEqual([
      {
        phoneNumber: "+15551234567",
        otpType: "signup",
        otpCode: "123456",
      },
    ]);

    const verifyResponse = await app.inject({
      method: "POST",
      url: "/auth/otp/verify",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        phoneNumber: "+15551234567",
        otpType: "signup",
        otpCode: "123456",
      },
    });

    expect(verifyResponse.statusCode).toBe(200);
    expect(verifyResponse.json()).toMatchObject({
      status: "authenticated",
      session: {
        phoneNumber: "+15551234567",
        tokenType: "Bearer",
      },
    });
  });

  it("refreshes a session with refresh-token rotation", async () => {
    const otpStore = new MemoryOtpStore();
    const sessionRepository = new MemoryAuthSessionRepository();
    const publisher = new FakeNotificationEventsPublisher();
    const app = createApp({
      authService: new AuthService(otpStore, sessionRepository, publisher),
    });

    await app.inject({
      method: "POST",
      url: "/auth/otp/request",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        phoneNumber: "+15551234567",
        otpType: "login",
      },
    });
    const verifyResponse = await app.inject({
      method: "POST",
      url: "/auth/otp/verify",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        phoneNumber: "+15551234567",
        otpType: "login",
        otpCode: "123456",
      },
    });
    const refreshToken = verifyResponse.json().session.refreshToken as string;

    const refreshResponse = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        refreshToken,
      },
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.json()).toMatchObject({
      status: "refreshed",
      session: {
        phoneNumber: "+15551234567",
      },
    });
    expect(refreshResponse.json().session.refreshToken).not.toBe(refreshToken);
  });
});
