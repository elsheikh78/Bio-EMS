import type Database from "better-sqlite3";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.BIOEMS_JWT_SECRET = "s".repeat(32);
});
vi.mock("./mqtt/client", () => ({ getMqttClient: vi.fn() }));
vi.mock("../database/influx/queries/telemetry.query", () => ({ getLatestTelemetry: vi.fn() }));
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
const tokens = new TokenService(config.jwt);
const hash = `$2b$12$${"A".repeat(53)}`;
const auth = (id: number) => ({
  Authorization: `Bearer ${tokens.issueAccessToken(id).accessToken}`,
});

describe("Admin User Management application boundary", () => {
  beforeEach(() => {
    database.exec("DELETE FROM users");
    insert(1, "admin", "ADMIN");
    insert(2, "operator", "OPERATOR");
    insert(3, "viewer", "VIEWER");
  });
  afterAll(() => database.close());

  it("allows ADMIN to list sanitized users in deterministic order", async () => {
    const response = await request(app).get("/api/v1/users").set(auth(1)).expect(200);
    expect(response.body.map((item: { id: number }) => item.id)).toEqual([1, 2, 3]);
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|\$2b\$/);
  });

  it.each([
    [undefined, 401],
    [2, 403],
    [3, 403],
  ] as const)("rejects non-ADMIN list access for %s", async (id, status) => {
    const operation = request(app).get("/api/v1/users");
    if (id) operation.set(auth(id));
    await operation.expect(status);
  });

  it.each([
    ["post", "/api/v1/users", { username: "another", password: "StrongPassword1", role: "VIEWER" }],
    ["patch", "/api/v1/users/3", { email: "viewer@example.com" }],
    ["patch", "/api/v1/users/3/status", { status: "disabled" }],
    ["put", "/api/v1/users/3/password", { password: "ReplacementPass1" }],
  ] as const)(
    "rejects unauthenticated, OPERATOR, and VIEWER access to %s %s",
    async (method, path, body) => {
      for (const [id, status] of [
        [undefined, 401],
        [2, 403],
        [3, 403],
      ] as const) {
        const operation =
          method === "post"
            ? request(app).post(path)
            : method === "put"
              ? request(app).put(path)
              : request(app).patch(path);
        if (id) operation.set(auth(id));
        await operation.send(body).expect(status);
      }
    }
  );

  it("creates a normalized user with a bcrypt password and no secret response", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .set(auth(1))
      .send({
        username: " New.User ",
        email: "new@example.com",
        password: "StrongPassword1",
        role: "VIEWER",
      })
      .expect(201);
    expect(response.body).toMatchObject({ username: "new.user", role: "VIEWER", status: "active" });
    expect(response.body).not.toHaveProperty("password_hash");
    const stored = database
      .prepare("SELECT password_hash FROM users WHERE username = 'new.user'")
      .get() as { password_hash: string };
    expect(stored.password_hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("returns stable validation, duplicate, and not-found errors", async () => {
    await request(app)
      .post("/api/v1/users")
      .set(auth(1))
      .send({ username: "x", password: "weak", role: "OWNER" })
      .expect(400);
    await request(app)
      .post("/api/v1/users")
      .set(auth(1))
      .send({ username: "viewer", password: "StrongPassword1", role: "VIEWER" })
      .expect(409);
    const missing = await request(app)
      .patch("/api/v1/users/99")
      .set(auth(1))
      .send({ email: null })
      .expect(404);
    expect(missing.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("prevents self role changes and self disablement", async () => {
    await request(app).patch("/api/v1/users/1").set(auth(1)).send({ role: "VIEWER" }).expect(409);
    await request(app)
      .patch("/api/v1/users/1/status")
      .set(auth(1))
      .send({ status: "disabled" })
      .expect(409);
    expect(database.prepare("SELECT role, status FROM users WHERE id = 1").get()).toEqual({
      role: "ADMIN",
      status: "active",
    });
  });

  it("allows ADMIN to update another user's metadata and role", async () => {
    const response = await request(app)
      .patch("/api/v1/users/3")
      .set(auth(1))
      .send({ email: "viewer@example.com", role: "OPERATOR" })
      .expect(200);

    expect(response.body).toMatchObject({ id: 3, email: "viewer@example.com", role: "OPERATOR" });
    expect(response.body).not.toHaveProperty("password_hash");
  });

  it("protects the last active ADMIN but permits changing another ADMIN", async () => {
    await request(app).patch("/api/v1/users/1").set(auth(1)).send({ role: "OPERATOR" }).expect(409);
    insert(4, "backup-admin", "ADMIN");
    await request(app)
      .patch("/api/v1/users/4/status")
      .set(auth(1))
      .send({ status: "disabled" })
      .expect(200);
  });

  it("changes a password through bcrypt and preserves authentication invalidation", async () => {
    const response = await request(app)
      .put("/api/v1/users/3/password")
      .set(auth(1))
      .send({ password: "ReplacementPass1" })
      .expect(200);
    expect(response.body).not.toHaveProperty("password_hash");
    database.prepare("UPDATE users SET status = 'disabled' WHERE id = 1").run();
    await request(app).get("/api/v1/users").set(auth(1)).expect(401);
    database.prepare("DELETE FROM users WHERE id = 1").run();
    await request(app).get("/api/v1/users").set(auth(1)).expect(401);
  });

  function insert(id: number, username: string, role: string) {
    database
      .prepare(
        "INSERT INTO users (id, username, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')"
      )
      .run(id, username, hash, role);
  }
});
