import type {
  GetUserResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserProfile,
} from "@repo/contracts";

type AuthFetch = <TResponse>(
  path: string,
  options?: {
    method?: string;
    body?: BodyInit | null;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<TResponse>;

export function getCurrentUser(authFetch: AuthFetch, signal?: AbortSignal) {
  return authFetch<GetUserResponse>("/me", {
    signal,
  });
}

export function updateCurrentUserProfile(
  authFetch: AuthFetch,
  input: UpdateUserProfileRequest,
  signal?: AbortSignal,
) {
  return authFetch<UpdateUserProfileResponse>("/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
}

export function isDefaultUserProfile(user: UserProfile) {
  return user.handle.startsWith("user_") || user.displayName.startsWith("X user ");
}
