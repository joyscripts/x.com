import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsResponse,
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

export function listPosts(
  authFetch: AuthFetch,
  input: {
    authorId?: string;
    cursor?: string;
    limit?: number;
  } = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();

  if (input.authorId) {
    query.set("authorId", input.authorId);
  }

  if (input.cursor) {
    query.set("cursor", input.cursor);
  }

  if (input.limit) {
    query.set("limit", String(input.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return authFetch<ListPostsResponse>(`/posts${suffix}`, {
    signal,
  });
}

export function getPost(authFetch: AuthFetch, id: string, signal?: AbortSignal) {
  return authFetch<GetPostResponse>(`/posts/${id}`, {
    signal,
  });
}

export function createPost(
  authFetch: AuthFetch,
  input: CreatePostRequest,
  signal?: AbortSignal,
) {
  return authFetch<CreatePostResponse>("/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
}

export function deletePost(
  authFetch: AuthFetch,
  id: string,
  signal?: AbortSignal,
) {
  return authFetch<DeletePostResponse>(`/posts/${id}`, {
    method: "DELETE",
    signal,
  });
}
