import type {
  AuthRefreshTokenResponse,
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
import type { UsersClient } from "@/modules/auth/users.client";

export interface AuthServicePort {
  requestOtp(input: AuthRequestOtpRequest): Promise<AuthRequestOtpResponse>;
  verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse>;
  refresh(refreshToken: string): Promise<AuthRefreshTokenResponse>;
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
  ) {
    this.tokenService = new AuthTokenService(env.AUTH_JWT_SECRET);
  }

  async requestOtp(
    input: AuthRequestOtpRequest,
  ): Promise<AuthRequestOtpResponse> {
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

  async verifyOtp(
    input: AuthVerifyOtpRequest,
  ): Promise<AuthVerifyOtpResponse> {
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

  async close() {
    await Promise.all([
      this.otpStore.close?.(),
      this.notificationEventsPublisher.close?.(),
    ]);
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
