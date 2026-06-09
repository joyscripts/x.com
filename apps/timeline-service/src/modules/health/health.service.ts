import type { HealthResponseDto } from "@/modules/health/dtos/health-response.dto";
import { env } from "@/config/env";

export class HealthService {
  getStatus(): HealthResponseDto {
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
