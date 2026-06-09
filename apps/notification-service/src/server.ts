import { createApp } from "@/app";
import { env } from "@/config/env";

async function bootstrap() {
  const app = createApp();

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();
