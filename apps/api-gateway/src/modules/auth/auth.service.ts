import type {
  AuthRefreshTokenRequest,
  AuthRefreshTokenResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
} from "@repo/contracts";
import {
  refreshTokenResponseSchema,
  requestOtpResponseSchema,
  verifyOtpResponseSchema,
} from "@/modules/auth/schemas/auth.schema";

export interface AuthGatewayServicePort {
  requestOtp(input: AuthRequestOtpRequest): Promise<AuthRequestOtpResponse>;
  verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse>;
  refresh(
    input: AuthRefreshTokenRequest,
  ): Promise<AuthRefreshTokenResponse>;
}

export class DownstreamAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "DownstreamAuthError";
  }
}

export class HttpAuthGatewayService implements AuthGatewayServicePort {
  constructor(
    private readonly authServiceUrl: string,
    private readonly internalServiceSecret: string,
  ) {}

  async requestOtp(
    input: AuthRequestOtpRequest,
  ): Promise<AuthRequestOtpResponse> {
    const payload = await this.postToAuthService("/auth/otp/request", input);

    return requestOtpResponseSchema.parse(payload);
  }

  async verifyOtp(
    input: AuthVerifyOtpRequest,
  ): Promise<AuthVerifyOtpResponse> {
    const payload = await this.postToAuthService("/auth/otp/verify", input);

    return verifyOtpResponseSchema.parse(payload);
  }

  async refresh(
    input: AuthRefreshTokenRequest,
  ): Promise<AuthRefreshTokenResponse> {
    const payload = await this.postToAuthService("/auth/refresh", input);

    return refreshTokenResponseSchema.parse(payload);
  }

  private async postToAuthService(path: string, body: unknown) {
    const response = await fetch(
      `${this.authServiceUrl.replace(/\/$/, "")}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-secret": this.internalServiceSecret,
        },
        body: JSON.stringify(body),
      },
    );
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new DownstreamAuthError(
        `Auth service request failed with HTTP ${response.status}`,
        response.status,
        payload,
      );
    }

    return payload;
  }
}
