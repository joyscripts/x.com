import type { HealthResponse } from "@repo/contracts";
import { env } from "@/config/env";

export class HealthService {
  getStatus(): HealthResponse {
    return {
      status: "ok",
      metadata: {
        service: env.SERVICE_NAME,
        version: env.SERVICE_VERSION,
        environment: env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
