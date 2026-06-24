import type { BootstrapUserResponse } from "@repo/contracts";
import { bootstrapUserResponseSchema } from "@repo/contracts";

export interface UsersClient {
  bootstrapUser(input: { phoneNumber: string }): Promise<BootstrapUserResponse>;
}

export class HttpUsersClient implements UsersClient {
  constructor(
    private readonly userServiceUrl: string,
    private readonly internalServiceSecret: string,
  ) {}

  async bootstrapUser(input: { phoneNumber: string }) {
    const response = await fetch(
      `${this.userServiceUrl.replace(/\/$/, "")}/users/bootstrap`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-secret": this.internalServiceSecret,
        },
        body: JSON.stringify(input),
      },
    );
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(
        `User service request failed with HTTP ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    return bootstrapUserResponseSchema.parse(payload);
  }
}
