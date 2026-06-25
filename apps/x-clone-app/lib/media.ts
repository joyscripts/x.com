import type { UploadMediaResponse } from "@repo/contracts";

type AuthFetch = <TResponse>(
  path: string,
  options?: {
    method?: string;
    body?: BodyInit | null;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<TResponse>;

export type UploadableMedia = {
  uri: string;
  filename: string;
  mimeType: string;
  file?: Blob;
};

export function uploadMedia(
  authFetch: AuthFetch,
  input: UploadableMedia,
  signal?: AbortSignal,
) {
  const formData = new FormData();

  if (input.file) {
    formData.append("file", input.file, input.filename);
  } else {
    formData.append("file", {
      uri: input.uri,
      name: input.filename,
      type: input.mimeType,
    } as unknown as Blob);
  }

  return authFetch<UploadMediaResponse>("/media/uploads", {
    method: "POST",
    body: formData,
    signal,
  });
}

export function resolveMediaUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const apiGatewayUrl = process.env.EXPO_PUBLIC_API_GATEWAY_URL;

  if (!apiGatewayUrl) {
    return url;
  }

  return `${apiGatewayUrl.replace(/\/$/, "")}${url}`;
}
