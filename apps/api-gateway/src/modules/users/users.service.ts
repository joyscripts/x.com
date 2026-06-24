import type {
  GetUserResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "@repo/contracts";
import {
  createGetUserResponseSchema,
  createUpdateUserProfileResponseSchema,
} from "@/modules/users/schemas/users.schema";

export interface UsersGatewayServicePort {
  getById(id: string): Promise<GetUserResponse>;
  updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse>;
}

export class DownstreamUserError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "DownstreamUserError";
  }
}

export class HttpUsersGatewayService implements UsersGatewayServicePort {
  constructor(
    private readonly userServiceUrl: string,
    private readonly internalServiceSecret: string,
  ) {}

  async getById(id: string): Promise<GetUserResponse> {
    const response = await fetch(
      `${this.userServiceUrl.replace(/\/$/, "")}/users/${id}`,
      {
        headers: {
          "x-internal-service-secret": this.internalServiceSecret,
        },
      },
    );
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new DownstreamUserError(
        `User service request failed with HTTP ${response.status}`,
        response.status,
        payload,
      );
    }

    return createGetUserResponseSchema.parse(payload);
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse> {
    const response = await fetch(
      `${this.userServiceUrl.replace(/\/$/, "")}/users/${id}/profile`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-secret": this.internalServiceSecret,
        },
        body: JSON.stringify(input),
      },
    );
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new DownstreamUserError(
        `User service request failed with HTTP ${response.status}`,
        response.status,
        payload,
      );
    }

    return createUpdateUserProfileResponseSchema.parse(payload);
  }
}
