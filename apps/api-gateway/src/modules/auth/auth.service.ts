import type {
  AuthRefreshTokenRequest,
  AuthRefreshTokenResponse,
  AuthLogoutRequest,
  AuthLogoutResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
} from "@repo/contracts";
import {
  DownstreamServiceError,
  InternalHttpClient,
} from "@/lib/internal-http-client";
import {
  logoutResponseSchema,
  refreshTokenResponseSchema,
  requestOtpResponseSchema,
  verifyOtpResponseSchema,
} from "@/modules/auth/schemas/auth.schema";

export type AuthRequestContext = {
  ipAddress?: string;
  deviceId?: string;
};

export interface AuthGatewayServicePort {
  requestOtp(
    input: AuthRequestOtpRequest,
    context?: AuthRequestContext,
  ): Promise<AuthRequestOtpResponse>;
  verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse>;
  refresh(input: AuthRefreshTokenRequest): Promise<AuthRefreshTokenResponse>;
  logout(input: AuthLogoutRequest): Promise<AuthLogoutResponse>;
}

export class DownstreamAuthError extends DownstreamServiceError {
  constructor(error: DownstreamServiceError) {
    super(error.serviceName, error.statusCode, error.payload);
    this.name = "DownstreamAuthError";
  }
}

export class HttpAuthGatewayService implements AuthGatewayServicePort {
  private readonly client: InternalHttpClient;

  constructor(authServiceUrl: string, internalServiceSecret: string) {
    this.client = new InternalHttpClient(
      "Auth service",
      authServiceUrl,
      internalServiceSecret,
    );
  }

  async requestOtp(
    input: AuthRequestOtpRequest,
    context: AuthRequestContext = {},
  ): Promise<AuthRequestOtpResponse> {
    const payload = await this.request("/auth/otp/request", {
      method: "POST",
      body: input,
      headers: {
        "x-client-ip": context.ipAddress,
        "x-device-id": context.deviceId,
      },
    });

    return requestOtpResponseSchema.parse(payload);
  }

  async verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse> {
    const payload = await this.request("/auth/otp/verify", {
      method: "POST",
      body: input,
    });

    return verifyOtpResponseSchema.parse(payload);
  }

  async refresh(
    input: AuthRefreshTokenRequest,
  ): Promise<AuthRefreshTokenResponse> {
    const payload = await this.request("/auth/refresh", {
      method: "POST",
      body: input,
    });

    return refreshTokenResponseSchema.parse(payload);
  }

  async logout(input: AuthLogoutRequest): Promise<AuthLogoutResponse> {
    const payload = await this.request("/auth/logout", {
      method: "POST",
      body: input,
    });

    return logoutResponseSchema.parse(payload);
  }

  private async request(
    path: string,
    options: Parameters<InternalHttpClient["requestJson"]>[1],
  ) {
    try {
      return await this.client.requestJson(path, options);
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        throw new DownstreamAuthError(error);
      }
      throw error;
    }
  }
}
