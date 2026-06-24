import { createHmac } from "node:crypto";
import type {
  GetUserResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import { AccessTokenService } from "@/modules/auth/access-token.service";
import type { UsersGatewayServicePort } from "@/modules/users/users.service";

const userId = "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10";
const jwtSecret = "test-jwt-secret";

class FakeUsersGatewayService implements UsersGatewayServicePort {
  public readonly fetchedIds: string[] = [];

  async getById(id: string): Promise<GetUserResponse> {
    this.fetchedIds.push(id);

    return {
      user: {
        id,
        phoneNumber: "+15551234567",
        handle: "user_15551234567",
        displayName: "X user 4567",
        bio: null,
        avatarUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse> {
    this.fetchedIds.push(id);

    return {
      user: {
        id,
        phoneNumber: "+15551234567",
        handle: input.handle,
        displayName: input.displayName,
        bio: input.bio ?? null,
        avatarUrl: input.avatarUrl ?? null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
  }
}

describe("user gateway routes", () => {
  it("returns the current user from a valid access token", async () => {
    const usersService = new FakeUsersGatewayService();
    const app = createApp({
      accessTokenService: new AccessTokenService(jwtSecret),
      usersService,
    });

    const response = await app.inject({
      method: "GET",
      url: "/me",
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        id: userId,
        handle: "user_15551234567",
      },
    });
    expect(usersService.fetchedIds).toEqual([userId]);
  });

  it("rejects missing bearer tokens", async () => {
    const app = createApp({
      accessTokenService: new AccessTokenService(jwtSecret),
      usersService: new FakeUsersGatewayService(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/me",
    });

    expect(response.statusCode).toBe(401);
  });

  it("updates the current user's profile", async () => {
    const usersService = new FakeUsersGatewayService();
    const app = createApp({
      accessTokenService: new AccessTokenService(jwtSecret),
      usersService,
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/me/profile",
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
      },
      payload: {
        handle: "joyscripts",
        displayName: "Joy Scripts",
        bio: "Building X Clone",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        id: userId,
        handle: "joyscripts",
        displayName: "Joy Scripts",
      },
    });
    expect(usersService.fetchedIds).toEqual([userId]);
  });
});

function createAccessToken() {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    phone_number: "+15551234567",
    iat: issuedAt,
    exp: issuedAt + 900,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const signature = createHmac("sha256", jwtSecret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}
