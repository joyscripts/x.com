export class DownstreamServiceError extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly statusCode: number,
    public readonly payload: unknown,
  ) {
    super(`${serviceName} request failed with HTTP ${statusCode}`);
    this.name = "DownstreamServiceError";
  }
}

export class InternalHttpClient {
  constructor(
    private readonly serviceName: string,
    private readonly baseUrl: string,
    private readonly internalServiceSecret: string,
    private readonly timeoutMs = 10_000,
  ) {}

  async requestJson(
    pathOrUrl: string | URL,
    options: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string | undefined>;
    } = {},
  ) {
    const response = await fetch(this.resolveUrl(pathOrUrl), {
      method: options.method,
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-secret": this.internalServiceSecret,
        ...compactHeaders(options.headers),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new DownstreamServiceError(
        this.serviceName,
        response.status,
        payload,
      );
    }

    return payload;
  }

  async requestStream(
    path: string,
    options: { headers?: Record<string, string | undefined> } = {},
  ) {
    const response = await fetch(this.resolveUrl(path), {
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: {
        "x-internal-service-secret": this.internalServiceSecret,
        ...compactHeaders(options.headers),
      },
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => undefined);

      throw new DownstreamServiceError(
        this.serviceName,
        response.status,
        payload,
      );
    }

    return response;
  }

  resolveUrl(pathOrUrl: string | URL) {
    return pathOrUrl instanceof URL
      ? pathOrUrl
      : `${this.baseUrl.replace(/\/$/, "")}${pathOrUrl}`;
  }
}

function compactHeaders(headers: Record<string, string | undefined> = {}) {
  return Object.fromEntries(
    Object.entries(headers).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
}
