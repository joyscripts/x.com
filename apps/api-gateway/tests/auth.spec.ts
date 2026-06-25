import type {
  AuthRefreshTokenResponse,
  AuthLogoutRequest,
  AuthLogoutResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import type {
  AuthGatewayServicePort,
  AuthRequestContext,
} from "@/modules/auth/auth.service";

class FakeAuthGatewayService implements AuthGatewayServicePort {
  public readonly otpContexts: AuthRequestContext[] = [];

  async requestOtp(
    input: AuthRequestOtpRequest,
    context: AuthRequestContext = {},
  ): Promise<AuthRequestOtpResponse> {
    this.otpContexts.push(context);

    return {
      status: "otp_sent",
      phoneNumber: input.phoneNumber,
      otpType: input.otpType,
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(input: AuthVerifyOtpRequest): Promise<AuthVerifyOtpResponse> {
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

  async logout(input: AuthLogoutRequest): Promise<AuthLogoutResponse> {
    expect(input.refreshToken).toBe("refresh-token");

    return { status: "logged_out" };
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

  it("forwards device hints when requesting OTP", async () => {
    const authService = new FakeAuthGatewayService();
    const app = createApp({ authService });

    await app.inject({
      method: "POST",
      url: "/auth/otp/request",
      headers: {
        "x-device-id": "device-1",
        "x-forwarded-for": "203.0.113.1",
      },
      payload: {
        phoneNumber: "+15551234567",
        otpType: "signup",
      },
    });

    expect(authService.otpContexts).toEqual([
      {
        deviceId: "device-1",
        ipAddress: "203.0.113.1",
      },
    ]);
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

  it("logs out through the gateway", async () => {
    const app = createApp({
      authService: new FakeAuthGatewayService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "logged_out" });
  });
});
