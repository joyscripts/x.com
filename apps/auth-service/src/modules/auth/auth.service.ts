import type {
  AuthRefreshTokenResponse,
  AuthLogoutResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthSession,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
} from "@repo/contracts";
import { env } from "@/config/env";
import { AuthError } from "@/modules/auth/auth.errors";
import type { AuthSessionRepository } from "@/modules/auth/auth.repository";
import {
  AuthTokenService,
  hashRefreshToken,
} from "@/modules/auth/auth-token.service";
import type { NotificationEventsPublisher } from "@/modules/auth/notification-events.publisher";
import type { OtpStore } from "@/modules/auth/otp.store";
import {
  NoopRateLimitStore,
  type RateLimitStore,
} from "@/modules/auth/rate-limit.store";
import type { UsersClient } from "@/modules/auth/users.client";

export type AuthRequestContext = {
  ipAddress?: string;
  deviceId?: string;
};

export interface AuthServicePort {
  requestOtp(
    input: AuthRequestOtpRequest,
    context?: AuthRequestContext,
  ): Promise<AuthRequestOtpResponse>;
  verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse>;
  refresh(refreshToken: string): Promise<AuthRefreshTokenResponse>;
  logout(refreshToken: string): Promise<AuthLogoutResponse>;
  close?(): Promise<void>;
}

function createOtpCode() {
  if (env.NODE_ENV === "test") {
    return "123456";
  }

  return String(Math.floor(100000 + Math.random() * 900000));
}

export class AuthService implements AuthServicePort {
  private readonly tokenService: AuthTokenService;

  constructor(
    private readonly otpStore: OtpStore,
    private readonly sessionRepository: AuthSessionRepository,
    private readonly notificationEventsPublisher: NotificationEventsPublisher,
    private readonly usersClient: UsersClient,
    private readonly rateLimitStore: RateLimitStore = new NoopRateLimitStore(),
  ) {
    this.tokenService = new AuthTokenService(env.AUTH_JWT_SECRET);
  }

  async requestOtp(
    input: AuthRequestOtpRequest,
    context: AuthRequestContext = {},
  ): Promise<AuthRequestOtpResponse> {
    await this.enforceOtpRateLimits(input, context);

    const otpCode = createOtpCode();

    await this.otpStore.save({
      phoneNumber: input.phoneNumber,
      otpType: input.otpType,
      otpCode,
      ttlSeconds: env.OTP_TTL_SECONDS,
    });
    await this.notificationEventsPublisher.publishOtpRequested({
      phoneNumber: input.phoneNumber,
      otpType: input.otpType,
      otpCode,
    });

    return {
      status: "otp_sent",
      phoneNumber: input.phoneNumber,
      otpType: input.otpType,
      expiresInSeconds: env.OTP_TTL_SECONDS,
    };
  }

  async verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse> {
    const otpResult = await this.otpStore.consume(input);

    if (otpResult.status !== "valid") {
      throw new AuthError("Invalid or expired OTP", 401, "INVALID_OTP");
    }

    const { user } = await this.usersClient.bootstrapUser({
      phoneNumber: input.phoneNumber,
    });
    const session = await this.createSession(user.id, user.phoneNumber);

    return {
      status: "authenticated",
      session,
    };
  }

  async refresh(refreshToken: string): Promise<AuthRefreshTokenResponse> {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const existingSession =
      await this.sessionRepository.findActiveByRefreshTokenHash(
        refreshTokenHash,
      );

    if (!existingSession) {
      const reusedSession =
        await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);

      if (reusedSession?.revokedAt) {
        await this.sessionRepository.revokeActiveForUser(reusedSession.userId);
        throw new AuthError(
          "Refresh token reuse detected",
          401,
          "REFRESH_REUSE_DETECTED",
        );
      }

      throw new AuthError("Invalid refresh token", 401, "INVALID_REFRESH");
    }

    await this.sessionRepository.revoke(existingSession.sessionId);

    return {
      status: "refreshed",
      session: await this.createSession(
        existingSession.userId,
        existingSession.phoneNumber,
      ),
    };
  }

  async logout(refreshToken: string): Promise<AuthLogoutResponse> {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const existingSession =
      await this.sessionRepository.findActiveByRefreshTokenHash(
        refreshTokenHash,
      );

    if (existingSession) {
      await this.sessionRepository.revoke(existingSession.sessionId);
    }

    return { status: "logged_out" };
  }

  async close() {
    await Promise.all([
      this.otpStore.close?.(),
      this.notificationEventsPublisher.close?.(),
      this.rateLimitStore.close?.(),
    ]);
  }

  private async enforceOtpRateLimits(
    input: AuthRequestOtpRequest,
    context: AuthRequestContext,
  ) {
    const checks = [
      {
        key: `auth:otp-rate:phone:${input.otpType}:${input.phoneNumber}`,
        limit: env.OTP_PHONE_RATE_LIMIT,
      },
      context.ipAddress
        ? {
            key: `auth:otp-rate:ip:${input.otpType}:${context.ipAddress}`,
            limit: env.OTP_IP_RATE_LIMIT,
          }
        : undefined,
      context.deviceId
        ? {
            key: `auth:otp-rate:device:${input.otpType}:${context.deviceId}`,
            limit: env.OTP_DEVICE_RATE_LIMIT,
          }
        : undefined,
    ].filter((check): check is { key: string; limit: number } =>
      Boolean(check),
    );

    for (const check of checks) {
      const result = await this.rateLimitStore.consume({
        key: check.key,
        limit: check.limit,
        windowSeconds: env.OTP_RATE_LIMIT_WINDOW_SECONDS,
      });

      if (!result.allowed) {
        throw new AuthError("Too many OTP requests", 429, "OTP_RATE_LIMITED");
      }
    }
  }

  private async createSession(
    userId: string,
    phoneNumber: string,
  ): Promise<AuthSession> {
    const tokenPair = this.tokenService.createTokenPair({
      userId,
      phoneNumber,
      accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    });

    await this.sessionRepository.create({
      userId,
      phoneNumber,
      refreshTokenHash: tokenPair.refreshTokenHash,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return {
      userId,
      phoneNumber,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: "Bearer",
      expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      refreshExpiresInSeconds: env.REFRESH_TOKEN_TTL_SECONDS,
    };
  }
}
