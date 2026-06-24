import { createHash } from "node:crypto";
import type {
  BootstrapUserRequest,
  BootstrapUserResponse,
  GetUserResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "@repo/contracts";
import { UsersError } from "@/modules/users/users.errors";
import { toUserProfileDto } from "@/modules/users/users.mapper";
import type { UsersRepository } from "@/modules/users/users.repository";

export interface UsersServicePort {
  bootstrap(input: BootstrapUserRequest): Promise<BootstrapUserResponse>;
  getById(id: string): Promise<GetUserResponse | undefined>;
  updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse>;
}

function createDefaultHandle(phoneNumber: string) {
  const digest = createHash("sha256").update(phoneNumber).digest("hex");

  return `user_${digest.slice(0, 10)}`;
}

function createDefaultDisplayName(phoneNumber: string) {
  const visibleTail = phoneNumber.slice(-4);

  return `X user ${visibleTail}`;
}

export class UsersService implements UsersServicePort {
  constructor(private readonly repository: UsersRepository) {}

  async bootstrap(input: BootstrapUserRequest): Promise<BootstrapUserResponse> {
    const existingUser = await this.repository.findByPhoneNumber(
      input.phoneNumber,
    );

    if (existingUser) {
      return {
        user: toUserProfileDto(existingUser),
      };
    }

    const user = await this.repository.create({
      phoneNumber: input.phoneNumber,
      handle: createDefaultHandle(input.phoneNumber),
      displayName: createDefaultDisplayName(input.phoneNumber),
    });

    return {
      user: toUserProfileDto(user),
    };
  }

  async getById(id: string): Promise<GetUserResponse | undefined> {
    const user = await this.repository.findById(id);

    if (!user) {
      return undefined;
    }

    return {
      user: toUserProfileDto(user),
    };
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse> {
    const existingUser = await this.repository.findById(id);

    if (!existingUser) {
      throw new UsersError("User not found", 404, "USER_NOT_FOUND");
    }

    const existingHandleOwner = await this.repository.findByHandle(
      input.handle,
    );

    if (existingHandleOwner && existingHandleOwner.id !== id) {
      throw new UsersError("Handle is already taken", 409, "HANDLE_TAKEN");
    }

    const updatedUser = await this.repository.updateProfile(id, {
      handle: input.handle,
      displayName: input.displayName,
      bio: input.bio ?? null,
      avatarUrl: input.avatarUrl ?? null,
    });

    if (!updatedUser) {
      throw new UsersError("User not found", 404, "USER_NOT_FOUND");
    }

    return {
      user: toUserProfileDto(updatedUser),
    };
  }
}
