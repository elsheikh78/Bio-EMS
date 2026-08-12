import type Database from "better-sqlite3";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.BIOEMS_JWT_SECRET = "s".repeat(32);
});

vi.mock("./mqtt/client", () => ({ getMqttClient: vi.fn() }));

vi.mock("../database/influx/queries/telemetry.query", () => ({
  getLatestTelemetry: vi.fn(),
}));

vi.mock("../database/influx/queries/room-status.query", () => ({
  getLatestRoomTelemetry: vi.fn(),
}));

vi.mock("../database/sqlite/client", async () => {
  const { default: SqliteDatabase } = await import("better-sqlite3");
  const sqlite = new SqliteDatabase(":memory:");
  sqlite.pragma("foreign_keys = ON");
  return { sqlite };
});

import { sqlite } from "../database/sqlite/client";
import app from "./app";
import { config } from "./config/config";
import { TokenService } from "./services/token.service";

const database = sqlite as Database.Database;
const tokenService = new TokenService(config.jwt);
const VALID_BCRYPT_HASH = `$2b$12$${"A".repeat(53)}`;

describe("Application authentication boundary", () => {
  beforeEach(() => {
    database.exec("DELETE FROM users");
    database
      .prepare(
        `INSERT INTO users (id, username, email, password_hash, role, status)
         VALUES (1, 'admin', NULL, ?, 'ADMIN', 'active')`
      )
      .run(VALID_BCRYPT_HASH);
  });

  afterAll(() => database.close());

  it("keeps the existing Health endpoint public", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    expect(response.body).toMatchObject({ status: "UP", project: "BIO EMS" });
  });

  it("keeps POST Login public while preserving validation and malformed JSON contracts", async () => {
    const invalid = await request(app).post("/api/v1/auth/login").send({}).expect(400);
    const malformed = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"username":')
      .expect(400);

    expect(invalid.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expect(malformed.body).toEqual(invalid.body);
  });

  it.each([
    "/api/v1/sites",
    "/api/v1/rooms",
    "/api/v1/sensors",
    "/api/v1/devices",
    "/api/v1/alarms",
    "/api/v1/dashboard/summary",
    "/api/v1/auth/login",
    "/api/v1/auth/other",
  ])("rejects anonymous GET %s before its handler", async (path) => {
    const response = await request(app).get(path).expect(401);

    expect(response.body).toEqual({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" },
    });
  });

  it("allows an active persisted User to reach an existing protected handler", async () => {
    const token = tokenService.issueAccessToken(1).accessToken;
    const response = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it.each(["ADMIN", "OPERATOR", "VIEWER"] as const)(
    "returns the current persisted %s principal from /auth/me without sensitive fields",
    async (role) => {
      database
        .prepare("UPDATE users SET username = ?, role = ? WHERE id = 1")
        .run("current-user", role);
      const token = tokenService.issueAccessToken(1).accessToken;

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        user: { id: 1, username: "current-user", role },
      });
      expect(Object.keys(response.body.user)).toEqual(["id", "username", "role"]);
      expect(JSON.stringify(response.body)).not.toMatch(
        /access_token|authorization|claim|email|password|status/i
      );
    }
  );

  it.each([
    ["missing", undefined],
    ["malformed", "NotBearer signed-token"],
    ["invalid", "Bearer invalid-token"],
  ])("rejects a %s token for /auth/me", async (_case, authorization) => {
    const operation = request(app).get("/api/v1/auth/me");
    if (authorization) operation.set("Authorization", authorization);

    const response = await operation.expect(401);

    expect(response.body).toEqual({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" },
    });
  });

  it("rejects an expired token for /auth/me", async () => {
    const expiredTokenService = new TokenService({ ...config.jwt, expireMinutes: -1 });
    const token = expiredTokenService.issueAccessToken(1).accessToken;

    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`).expect(401);
  });

  it("returns 404 only after an unknown protected route authenticates", async () => {
    await request(app).get("/api/v1/not-a-route").expect(401);

    const token = tokenService.issueAccessToken(1).accessToken;
    await request(app)
      .get("/api/v1/not-a-route")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  it("invalidates the issued token immediately after persisted disablement or removal", async () => {
    const token = tokenService.issueAccessToken(1).accessToken;
    const authorized = () =>
      request(app).get("/api/v1/sites").set("Authorization", `Bearer ${token}`);

    await authorized().expect(200);
    database.prepare("UPDATE users SET status = 'disabled' WHERE id = 1").run();
    await authorized().expect(401);
    database.prepare("DELETE FROM users WHERE id = 1").run();
    await authorized().expect(401);
  });

  it("invalidates /auth/me immediately after persisted disablement or removal", async () => {
    const token = tokenService.issueAccessToken(1).accessToken;
    const currentUser = () =>
      request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

    await currentUser().expect(200);
    database.prepare("UPDATE users SET status = 'disabled' WHERE id = 1").run();
    await currentUser().expect(401);
    database.prepare("DELETE FROM users WHERE id = 1").run();
    await currentUser().expect(401);
  });
});
