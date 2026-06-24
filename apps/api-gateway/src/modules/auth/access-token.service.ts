import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  phone_number: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export class AccessTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessTokenError";
  }
}

export class AccessTokenService {
  constructor(private readonly jwtSecret: string) {}

  verify(accessToken: string): AccessTokenPayload {
    const [encodedHeader, encodedPayload, signature] = accessToken.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new AccessTokenError("Invalid access token");
    }

    const expectedSignature = createHmac("sha256", this.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    if (!safeEqual(signature, expectedSignature)) {
      throw new AccessTokenError("Invalid access token signature");
    }

    const payload = accessTokenPayloadSchema.parse(
      JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")),
    );

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new AccessTokenError("Access token expired");
    }

    return payload;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
