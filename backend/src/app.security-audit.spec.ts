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

import { hashPassword } from "./services/password.service";
import { UserRepository } from "./repositories/user.repository";

describe("customer security audit regressions", () => {
  const users = new UserRepository(database);
  beforeEach(() => {
    database.exec("UPDATE users SET password_change_required=0,status='active' WHERE id=1");
    database
      .prepare(
        "INSERT INTO users (id,username,password_hash,role,status) VALUES (1,'security-user',?,'ADMIN','active') ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash"
      )
      .run(VALID_BCRYPT_HASH);
  });
  afterAll(() => database.close());

  it("revokes old tokens on repository password reset and direct offline-style credential replacement", async () => {
    const old = tokenService.issueAccessToken(1).accessToken;
    users.updatePasswordHash(1, `$2b$12$${"B".repeat(53)}`, true);
    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${old}`).expect(401);
    const forced = tokenService.issueAccessToken(1).accessToken;
    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${forced}`).expect(403);
    database
      .prepare("UPDATE users SET password_hash=?,password_change_required=0 WHERE id=1")
      .run(`$2b$12$${"C".repeat(53)}`);
    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${forced}`).expect(401);
    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${tokenService.issueAccessToken(1).accessToken}`)
      .expect(200);
  });

  it("rotates the current session after own password change and rejects all older tokens", async () => {
    users.updatePasswordHash(1, await hashPassword("OldPassword123!"), true);
    const old = tokenService.issueAccessToken(1).accessToken;
    const response = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${old}`)
      .send({ current_password: "OldPassword123!", new_password: "NewPassword456!" })
      .expect(200);
    expect(response.body).toMatchObject({
      success: true,
      password_change_required: false,
      token_type: "bearer",
      user: { id: 1 },
    });
    expect(response.body.access_token).not.toBe(old);
    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${old}`).expect(401);
    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${response.body.access_token}`)
      .expect(200);
  });

  it("does not invalidate a token when a password change is rejected", async () => {
    users.updatePasswordHash(1, await hashPassword("OldPassword123!"));
    const token = tokenService.issueAccessToken(1).accessToken;
    await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ current_password: "WrongPassword123!", new_password: "NewPassword456!" })
      .expect(401);
    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
  });

  it("rejects a stale credential snapshot during login issuance", () => {
    expect(() => tokenService.issueAccessToken(1, "stale credential")).toThrow();
  });

  it("rate limits the real login route and ignores forged forwarded-address headers", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post("/api/v1/auth/login")
        .set("X-Forwarded-For", `10.0.0.${i}`)
        .send({ username: `absent-${i}`, password: "WrongPassword123!" })
        .expect(401);
    }
    const blocked = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "another", password: "WrongPassword123!" })
      .expect(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect(blocked.body.error.code).toBe("CUSTOMER_LOGIN_RATE_LIMITED");
  });
});
