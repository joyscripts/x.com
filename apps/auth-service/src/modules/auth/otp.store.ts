import { createClient, type RedisClientType } from "redis";
import type { OtpType } from "@repo/contracts";

type OtpRecord = {
  phoneNumber: string;
  otpType: OtpType;
  otpCode: string;
  attemptsRemaining: number;
  expiresAt: string;
};

export type ConsumeOtpResult =
  | { status: "valid" }
  | { status: "missing" }
  | { status: "invalid"; attemptsRemaining: number };

export interface OtpStore {
  save(input: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
    ttlSeconds: number;
  }): Promise<void>;
  consume(input: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }): Promise<ConsumeOtpResult>;
  close?(): Promise<void>;
}

function createOtpKey(phoneNumber: string, otpType: OtpType) {
  return `auth:otp:${otpType}:${phoneNumber}`;
}

export class RedisOtpStore implements OtpStore {
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

  async save({
    phoneNumber,
    otpType,
    otpCode,
    ttlSeconds,
  }: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
    ttlSeconds: number;
  }) {
    const client = await this.getClient();
    const record: OtpRecord = {
      phoneNumber,
      otpType,
      otpCode,
      attemptsRemaining: 5,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    await client.set(createOtpKey(phoneNumber, otpType), JSON.stringify(record), {
      EX: ttlSeconds,
    });
  }

  async consume({
    phoneNumber,
    otpType,
    otpCode,
  }: {
    phoneNumber: string;
    otpType: OtpType;
    otpCode: string;
  }): Promise<ConsumeOtpResult> {
    const client = await this.getClient();
    const key = createOtpKey(phoneNumber, otpType);
    const rawRecord = await client.get(key);

    if (!rawRecord) {
      return { status: "missing" };
    }

    const record = JSON.parse(rawRecord) as OtpRecord;

    if (record.otpCode === otpCode) {
      await client.del(key);
      return { status: "valid" };
    }

    const attemptsRemaining = Math.max(record.attemptsRemaining - 1, 0);

    if (attemptsRemaining === 0) {
      await client.del(key);
      return { status: "missing" };
    }

    await client.set(
      key,
      JSON.stringify({
        ...record,
        attemptsRemaining,
      }),
      {
        KEEPTTL: true,
      },
    );

    return {
      status: "invalid",
      attemptsRemaining,
    };
  }

  async close() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
