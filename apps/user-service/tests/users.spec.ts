import type {
  BootstrapUserRequest,
  BootstrapUserResponse,
  GetUserResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import { UsersError } from "@/modules/users/users.errors";
import type { UsersServicePort } from "@/modules/users/users.service";

class FakeUsersService implements UsersServicePort {
  async bootstrap(
    input: BootstrapUserRequest,
  ): Promise<BootstrapUserResponse> {
    return {
      user: createUser(input.phoneNumber),
    };
  }

  async getById(id: string): Promise<GetUserResponse | undefined> {
    if (id !== "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10") {
      return undefined;
    }

    return {
      user: createUser("+15551234567"),
    };
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse> {
    if (id !== "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10") {
      throw new UsersError("User not found", 404, "USER_NOT_FOUND");
    }

    if (input.handle === "taken") {
      throw new UsersError("Handle is already taken", 409, "HANDLE_TAKEN");
    }

    return {
      user: {
        ...createUser("+15551234567"),
        handle: input.handle,
        displayName: input.displayName,
        bio: input.bio ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
    };
  }
}

function createUser(phoneNumber: string) {
  return {
    id: "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10",
    phoneNumber,
    handle: "user_15551234567",
    displayName: "X user 4567",
    bio: null,
    avatarUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("users routes", () => {
  it("keeps user routes internal", async () => {
    const app = createApp({
      usersService: new FakeUsersService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/users/bootstrap",
      payload: {
        phoneNumber: "+15551234567",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("bootstraps a user by phone number", async () => {
    const app = createApp({
      usersService: new FakeUsersService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/users/bootstrap",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        phoneNumber: "+15551234567",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        id: "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10",
        phoneNumber: "+15551234567",
      },
    });
  });

  it("returns a user by id", async () => {
    const app = createApp({
      usersService: new FakeUsersService(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/users/9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        handle: "user_15551234567",
      },
    });
  });

  it("returns 404 for a missing user", async () => {
    const app = createApp({
      usersService: new FakeUsersService(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/users/7d1122ba-36e5-47cf-b64a-ce6f568c7a32",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("updates a user profile", async () => {
    const app = createApp({
      usersService: new FakeUsersService(),
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/users/9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10/profile",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
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
        handle: "joyscripts",
        displayName: "Joy Scripts",
        bio: "Building X Clone",
      },
    });
  });

  it("rejects a taken handle", async () => {
    const app = createApp({
      usersService: new FakeUsersService(),
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/users/9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10/profile",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        handle: "taken",
        displayName: "Joy Scripts",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: "HANDLE_TAKEN",
    });
  });
});
