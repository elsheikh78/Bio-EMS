import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createBrowserSecurityMiddleware } from "../browser-security.middleware";

function testApplication() {
  const app = express();
  app.use(createBrowserSecurityMiddleware({ allowedOrigins: ["https://ems.example.com"] }));
  app.get("/health", (_req, res) => res.json({ status: "UP" }));
  return app;
}

describe("browser security middleware", () => {
  it("allows an exact configured browser origin", async () => {
    const response = await request(testApplication())
      .get("/health")
      .set("Origin", "https://ems.example.com")
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBe("https://ems.example.com");
    expect(response.headers.vary).toContain("Origin");
  });

  it("does not grant CORS access to an unconfigured origin", async () => {
    const response = await request(testApplication())
      .get("/health")
      .set("Origin", "https://attacker.example")
      .expect(200);

    expect(response.headers).not.toHaveProperty("access-control-allow-origin");
  });

  it("adds Helmet security headers without claiming to protect frontend assets", async () => {
    const response = await request(testApplication()).get("/health").expect(200);

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});
