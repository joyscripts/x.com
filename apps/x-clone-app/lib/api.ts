const apiGatewayUrl = process.env.EXPO_PUBLIC_API_GATEWAY_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiGatewayUrl() {
  if (!apiGatewayUrl) {
    throw new ApiError(
      "EXPO_PUBLIC_API_GATEWAY_URL is not defined",
      0,
    );
  }

  return apiGatewayUrl.replace(/\/$/, "");
}

export async function postJson<TResponse>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${getApiGatewayUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Network error while calling API gateway", 0, {
      cause: error,
    });
  }

  const payload = await response
    .json()
    .catch(() => undefined as TResponse | undefined);

  if (!response.ok) {
    throw new ApiError(
      `API gateway request failed with HTTP ${response.status}`,
      response.status,
      payload,
    );
  }

  return payload as TResponse;
}
