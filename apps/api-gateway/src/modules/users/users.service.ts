import type {
  GetUserResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "@repo/contracts";
import {
  DownstreamServiceError,
  InternalHttpClient,
} from "@/lib/internal-http-client";
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

export class DownstreamUserError extends DownstreamServiceError {
  constructor(error: DownstreamServiceError) {
    super(error.serviceName, error.statusCode, error.payload);
    this.name = "DownstreamUserError";
  }
}

export class HttpUsersGatewayService implements UsersGatewayServicePort {
  private readonly client: InternalHttpClient;

  constructor(userServiceUrl: string, internalServiceSecret: string) {
    this.client = new InternalHttpClient(
      "User service",
      userServiceUrl,
      internalServiceSecret,
    );
  }

  async getById(id: string): Promise<GetUserResponse> {
    const payload = await this.request(`/users/${id}`);

    return createGetUserResponseSchema.parse(payload);
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse> {
    const payload = await this.request(`/users/${id}/profile`, {
      method: "PATCH",
      body: input,
    });

    return createUpdateUserProfileResponseSchema.parse(payload);
  }

  private async request(
    path: string,
    options: Parameters<InternalHttpClient["requestJson"]>[1] = {},
  ) {
    try {
      return await this.client.requestJson(path, options);
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        throw new DownstreamUserError(error);
      }
      throw error;
    }
  }
}
