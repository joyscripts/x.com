import { useCallback } from "react";
import { ApiError, getApiGatewayUrl, parseJsonResponse } from "@/lib/api";
import {
  clearAuthSession,
  getAccessToken,
  refreshAuthSession,
} from "@/lib/auth";

type PrivateFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export function useAuthPrivate() {
  const authFetch = useCallback(
    async <TResponse,>(
      path: string,
      options: PrivateFetchOptions = {},
    ): Promise<TResponse> => {
      const response = await fetchWithCurrentAccessToken(path, options);

      if (response.status !== 401) {
        return parseJsonResponse<TResponse>(response);
      }

      const refreshedSession = await refreshAuthSession();

      if (!refreshedSession) {
        await clearAuthSession();
        throw new ApiError("Authentication required", 401);
      }

      const retryResponse = await fetchWithCurrentAccessToken(path, options);

      return parseJsonResponse<TResponse>(retryResponse);
    },
    [],
  );

  return {
    authFetch,
  };
}

async function fetchWithCurrentAccessToken(
  path: string,
  options: PrivateFetchOptions,
) {
  const accessToken = await getAccessToken();

  return fetch(`${getApiGatewayUrl()}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  });
}
