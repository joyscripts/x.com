import { createHmac, randomBytes } from "node:crypto";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

export function hashRefreshToken(refreshToken: string) {
  return createHmac("sha256", "refresh-token-hash")
    .update(refreshToken)
    .digest("hex");
}

export class AuthTokenService {
  constructor(private readonly jwtSecret: string) {}

  createTokenPair({
    userId,
    phoneNumber,
    accessTokenTtlSeconds,
  }: {
    userId: string;
    phoneNumber: string;
    accessTokenTtlSeconds: number;
  }): TokenPair {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + accessTokenTtlSeconds;
    const header = {
      alg: "HS256",
      typ: "JWT",
    };
    const payload = {
      sub: userId,
      phone_number: phoneNumber,
      iat: issuedAt,
      exp: expiresAt,
    };
    const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
      JSON.stringify(payload),
    )}`;
    const signature = createHmac("sha256", this.jwtSecret)
      .update(unsignedToken)
      .digest("base64url");
    const refreshToken = randomBytes(48).toString("base64url");

    return {
      accessToken: `${unsignedToken}.${signature}`,
      refreshToken,
      refreshTokenHash: hashRefreshToken(refreshToken),
    };
  }
}
