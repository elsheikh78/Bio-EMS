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
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|password|\$2b\$/i);
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
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|password|\$2b\$/i);
    const stored = database
      .prepare("SELECT password_hash FROM users WHERE username = 'new.user'")
      .get() as { password_hash: string };
    expect(stored.password_hash).toMatch(/^\$2[aby]\$12\$/);
    expect(latestAudit("USER.CREATED")).toMatchObject({
      actor_id: "1",
      actor_role: "ADMIN",
      target_type: "USER",
      target_id: String(response.body.id),
      result: "SUCCESS",
      previous_values_json: null,
      new_values_json: JSON.stringify({
        username: "new.user",
        email: "new@example.com",
        role: "VIEWER",
        status: "active",
      }),
    });
  });

  it.each([
    ["missing username", { password: "StrongPassword1", role: "VIEWER" }],
    [
      "unknown key",
      { username: "new-user", password: "StrongPassword1", role: "VIEWER", unexpected: true },
    ],
    ["invalid role", { username: "new-user", password: "StrongPassword1", role: "OWNER" }],
    ["invalid password", { username: "new-user", password: "weak", role: "VIEWER" }],
  ])("rejects POST /users with %s", async (_case, body) => {
    const response = await request(app).post("/api/v1/users").set(auth(1)).send(body).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a duplicate username with the stable conflict contract", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .set(auth(1))
      .send({ username: "viewer", password: "StrongPassword1", role: "VIEWER" })
      .expect(409);
    expect(response.body.error.code).toBe("RESOURCE_ALREADY_EXISTS");
    expect(latestAudit("USER.CREATED")).toMatchObject({
      actor_id: "1",
      result: "FAILED",
      reason: "RESOURCE_ALREADY_EXISTS",
      previous_values_json: null,
      new_values_json: null,
    });
  });

  it("keeps every ADMIN account under SYSTEM_OWNER management", async () => {
    const roleResponse = await request(app)
      .patch("/api/v1/users/1")
      .set(auth(1))
      .send({ role: "VIEWER" })
      .expect(403);
    expect(roleResponse.body.error.code).toBe("ADMIN_MANAGED_BY_SYSTEM_OWNER");

    const statusResponse = await request(app)
      .patch("/api/v1/users/1/status")
      .set(auth(1))
      .send({ status: "disabled" })
      .expect(409);
    expect(statusResponse.body.error.code).toBe("SELF_DISABLE_FORBIDDEN");
    expect(database.prepare("SELECT role, status FROM users WHERE id = 1").get()).toEqual({
      role: "ADMIN",
      status: "active",
    });
  });

  it.each([
    ["empty body", "/api/v1/users/3", {}],
    ["unknown key", "/api/v1/users/3", { unexpected: true }],
    ["invalid role", "/api/v1/users/3", { role: "OWNER" }],
    ["whitespace user_id", "/api/v1/users/%20", { role: "VIEWER" }],
  ])("rejects PATCH /users/{user_id} with %s", async (_case, path, body) => {
    const response = await request(app).patch(path).set(auth(1)).send(body).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it.each([
    ["id", { email: "changed@example.com", id: 1 }],
    ["password hash", { email: "changed@example.com", password_hash: "attacker-value" }],
    ["status", { email: "changed@example.com", status: "disabled" }],
    ["created timestamp", { email: "changed@example.com", created_at: "2000-01-01" }],
    ["permissions", { email: "changed@example.com", permissions: ["user:manage"] }],
    ["constructor", { email: "changed@example.com", constructor: { role: "ADMIN" } }],
    ["prototype-style key", JSON.parse('{"__proto__":{"role":"ADMIN"}}')],
  ])("rejects mass assignment through the protected %s field", async (_field, body) => {
    const before = database.prepare("SELECT * FROM users WHERE id = 3").get();

    const response = await request(app)
      .patch("/api/v1/users/3")
      .set(auth(1))
      .send(body)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(database.prepare("SELECT * FROM users WHERE id = 3").get()).toEqual(before);
  });

  it("rejects malformed authenticated JSON without reflecting sensitive input", async () => {
    const sensitiveMarker = "authorization-bearer-sensitive-marker";

    const response = await request(app)
      .patch("/api/v1/users/3")
      .set(auth(1))
      .set("Content-Type", "application/json")
      .send(`{"email":"${sensitiveMarker}"`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expect(JSON.stringify(response.body)).not.toContain(sensitiveMarker);
  });

  it("returns USER_NOT_FOUND when PATCH targets a missing user", async () => {
    const response = await request(app)
      .patch("/api/v1/users/99")
      .set(auth(1))
      .send({ email: null })
      .expect(404);
    expect(response.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("allows ADMIN to update another user's metadata and role", async () => {
    const response = await request(app)
      .patch("/api/v1/users/3")
      .set(auth(1))
      .send({ email: "viewer@example.com", role: "OPERATOR" })
      .expect(200);

    expect(response.body).toMatchObject({ id: 3, email: "viewer@example.com", role: "OPERATOR" });
    expect(response.body).not.toHaveProperty("password_hash");
    expect(latestAudit("USER.PROFILE_UPDATED", "3")).toMatchObject({
      result: "SUCCESS",
      previous_values_json: JSON.stringify({ email: null, role: "VIEWER" }),
      new_values_json: JSON.stringify({ email: "viewer@example.com", role: "OPERATOR" }),
    });
  });

  it("prevents ADMIN from changing another ADMIN", async () => {
    insert(4, "backup-admin", "ADMIN");
    await request(app)
      .patch("/api/v1/users/4/status")
      .set(auth(1))
      .send({ status: "disabled" })
      .expect(403);
    expect(latestAudit("USER.STATUS_UPDATED", "4")).toMatchObject({
      result: "FAILED",
      reason: "ADMIN_MANAGED_BY_SYSTEM_OWNER",
    });
  });

  it.each([
    ["invalid status", "/api/v1/users/3/status", { status: "pending" }],
    ["unknown key", "/api/v1/users/3/status", { status: "active", unexpected: true }],
    ["whitespace user_id", "/api/v1/users/%20/status", { status: "disabled" }],
  ])("rejects PATCH /users/{user_id}/status with %s", async (_case, path, body) => {
    const response = await request(app).patch(path).set(auth(1)).send(body).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns USER_NOT_FOUND for missing status target and documents status no-op", async () => {
    const missing = await request(app)
      .patch("/api/v1/users/99/status")
      .set(auth(1))
      .send({ status: "disabled" })
      .expect(404);
    expect(missing.body.error.code).toBe("USER_NOT_FOUND");

    const noOp = await request(app)
      .patch("/api/v1/users/3/status")
      .set(auth(1))
      .send({ status: "active" })
      .expect(200);
    expect(noOp.body).toMatchObject({ id: 3, status: "active" });
  });

  it("changes a password through bcrypt and preserves authentication invalidation", async () => {
    const previousHash = (
      database.prepare("SELECT password_hash FROM users WHERE id = 3").get() as {
        password_hash: string;
      }
    ).password_hash;
    const response = await request(app)
      .put("/api/v1/users/3/password")
      .set(auth(1))
      .send({ password: "ReplacementPass1" })
      .expect(200);
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|password|ReplacementPass1/i);
    const storedHash = (
      database.prepare("SELECT password_hash FROM users WHERE id = 3").get() as {
        password_hash: string;
      }
    ).password_hash;
    expect(storedHash).not.toBe(previousHash);
    expect(storedHash).not.toBe("ReplacementPass1");
    const passwordAudit = latestAudit("USER.PASSWORD_UPDATED", "3");
    expect(passwordAudit).toMatchObject({
      result: "SUCCESS",
      previous_values_json: null,
      new_values_json: null,
    });
    expect(JSON.stringify(passwordAudit)).not.toMatch(/ReplacementPass1|\$2b\$/i);
    database.prepare("UPDATE users SET status = 'disabled' WHERE id = 1").run();
    await request(app).get("/api/v1/users").set(auth(1)).expect(401);
    database.prepare("DELETE FROM users WHERE id = 1").run();
    await request(app).get("/api/v1/users").set(auth(1)).expect(401);
  });

  it.each([
    ["invalid password", "/api/v1/users/3/password", { password: "weak" }],
    ["missing password", "/api/v1/users/3/password", {}],
    ["unknown key", "/api/v1/users/3/password", { password: "ReplacementPass1", extra: true }],
    ["whitespace user_id", "/api/v1/users/%20/password", { password: "ReplacementPass1" }],
  ])("rejects PUT /users/{user_id}/password with %s", async (_case, path, body) => {
    const response = await request(app).put(path).set(auth(1)).send(body).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns USER_NOT_FOUND when password target is missing", async () => {
    const response = await request(app)
      .put("/api/v1/users/99/password")
      .set(auth(1))
      .send({ password: "ReplacementPass1" })
      .expect(404);
    expect(response.body.error.code).toBe("USER_NOT_FOUND");
    expect(latestAudit("USER.PASSWORD_UPDATED", "99")).toMatchObject({
      result: "FAILED",
      reason: "USER_NOT_FOUND",
    });
  });

  it("audits authenticated authorization denial without copying the request body", async () => {
    const marker = "do-not-persist-request-body";
    await request(app)
      .patch("/api/v1/users/3")
      .set(auth(2))
      .send({ email: `${marker}@example.com` })
      .expect(403);

    const denied = latestAudit("USER.PROFILE_UPDATED", "3");
    expect(denied).toMatchObject({
      actor_id: "2",
      actor_role: "OPERATOR",
      result: "DENIED",
      reason: "FORBIDDEN",
      previous_values_json: null,
      new_values_json: null,
    });
    expect(JSON.stringify(denied)).not.toContain(marker);
  });

  it("does not audit rejected validation input", async () => {
    const before = auditCount("USER.PROFILE_UPDATED");
    await request(app)
      .patch("/api/v1/users/3")
      .set(auth(1))
      .send({ unexpected: "hostile-value" })
      .expect(400);
    expect(auditCount("USER.PROFILE_UPDATED")).toBe(before);
  });

  it("rolls back the User mutation when SUCCESS audit persistence fails", async () => {
    database.exec(`
      CREATE TRIGGER bf03_test_block_audit_insert
      BEFORE INSERT ON audit_events
      BEGIN
        SELECT RAISE(ABORT, 'blocked audit insert');
      END;
    `);

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      await request(app)
        .patch("/api/v1/users/3")
        .set(auth(1))
        .send({ email: "must-rollback@example.com" })
        .expect(500);
    } finally {
      database.exec("DROP TRIGGER bf03_test_block_audit_insert");
      consoleError.mockRestore();
    }

    expect(database.prepare("SELECT email FROM users WHERE id = 3").get()).toEqual({
      email: null,
    });
  });

  function insert(id: number, username: string, role: string) {
    database
      .prepare(
        "INSERT INTO users (id, username, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')"
      )
      .run(id, username, hash, role);
  }

  function latestAudit(action: string, targetId?: string) {
    return database
      .prepare(
        `SELECT actor_id, actor_role, target_type, target_id, result,
                previous_values_json, new_values_json, reason
         FROM audit_events
         WHERE action = ? AND (? IS NULL OR target_id = ?)
         ORDER BY rowid DESC
         LIMIT 1`
      )
      .get(action, targetId ?? null, targetId ?? null) as Record<string, unknown>;
  }

  function auditCount(action: string): number {
    return (
      database
        .prepare("SELECT COUNT(*) AS count FROM audit_events WHERE action = ?")
        .get(action) as {
        count: number;
      }
    ).count;
  }
});
