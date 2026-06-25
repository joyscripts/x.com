import { createClient, type RedisClientType } from "redis";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export interface RateLimitStore {
  consume(input: {
    key: string;
    limit: number;
    windowSeconds: number;
  }): Promise<RateLimitResult>;
  close?(): Promise<void>;
}

export class NoopRateLimitStore implements RateLimitStore {
  async consume(): Promise<RateLimitResult> {
    return { allowed: true };
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  private readonly client: RedisClientType;
  private connectPromise: Promise<RedisClientType> | undefined;

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
  }

  private async getClient() {
    if (!this.connectPromise) {
      this.connectPromise = this.client.connect().then(() => this.client);
    }

    return this.connectPromise;
  }

  async consume(input: {
    key: string;
    limit: number;
    windowSeconds: number;
  }): Promise<RateLimitResult> {
    const client = await this.getClient();
    const count = await client.incr(input.key);

    if (count === 1) {
      await client.expire(input.key, input.windowSeconds);
    }

    if (count <= input.limit) {
      return { allowed: true };
    }

    const ttl = await client.ttl(input.key);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(ttl, 1),
    };
  }

  async close() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
