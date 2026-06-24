import type { UserProfile } from "@repo/contracts";
import type { UserRow } from "@/db/schema";

export function toUserProfileDto(user: UserRow): UserProfile {
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
