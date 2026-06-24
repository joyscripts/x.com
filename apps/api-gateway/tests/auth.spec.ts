import type {
  AuthRefreshTokenResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import type { AuthGatewayServicePort } from "@/modules/auth/auth.service";

class FakeAuthGatewayService implements AuthGatewayServicePort {
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
        userId: "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10",
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
        userId: "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10",
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

describe("auth gateway routes", () => {
  it("requests an OTP through the gateway", async () => {
    const app = createApp({
      authService: new FakeAuthGatewayService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/otp/request",
      payload: {
        phoneNumber: "+15551234567",
        otpType: "signup",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({
      status: "otp_sent",
      otpType: "signup",
    });
  });

  it("verifies an OTP through the gateway", async () => {
    const app = createApp({
      authService: new FakeAuthGatewayService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/otp/verify",
      payload: {
        phoneNumber: "+15551234567",
        otpType: "login",
        otpCode: "123456",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "authenticated",
      session: {
        tokenType: "Bearer",
      },
    });
  });

  it("refreshes a session through the gateway", async () => {
    const app = createApp({
      authService: new FakeAuthGatewayService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "refreshed",
      session: {
        accessToken: "new-access-token",
      },
    });
  });
});
