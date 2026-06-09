import { createApp } from "@/app";

describe("health route", () => {
  it("returns the service status payload", async () => {
    const app = createApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      metadata: {
        service: expect.any(String),
      },
    });
  });
});
