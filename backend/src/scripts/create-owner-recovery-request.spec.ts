import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { migration003 } from "../../database/sqlite/migrations/003_create_users";
import { migration009 } from "../../database/sqlite/migrations/009_create_platform_principals";
import { migration026 } from "../../database/sqlite/migrations/026_harden_owner_access";
import { migration028 } from "../../database/sqlite/migrations/028_create_password_recovery_domain";
import { hashPassword } from "../services/password.service";

const { database } = vi.hoisted(() => ({
  database: new Database(":memory:"),
}));

vi.mock("../../database/sqlite/client", () => ({ sqlite: database }));
vi.mock("../../database/sqlite/schema", () => ({ createTables: vi.fn() }));
vi.mock("../../database/sqlite/migration-runner", () => ({ runMigrations: vi.fn() }));

import { runCreateOwnerRecoveryRequest } from "./create-owner-recovery-request";

describe("System Owner recovery request creation", () => {
  let directory: string;
  let identityPath: string;
  let outputPath: string;
  let installationId: string;
  const now = new Date("2026-09-18T08:00:00.000Z");

  beforeEach(async () => {
    database.exec(`
      DROP TABLE IF EXISTS password_recovery_audit;
      DROP TABLE IF EXISTS password_recovery_requests;
      DROP TABLE IF EXISTS platform_principals;
      DROP TABLE IF EXISTS users;
    `);
    migration003.up(database);
    migration009.up(database);
    migration026.up(database);
    migration028.up(database);
    directory = mkdtempSync(join(tmpdir(), "bioems-owner-recovery-request-"));
    identityPath = join(directory, "installation-identity.json");
    outputPath = join(directory, "owner-recovery-request.json");
    installationId = randomUUID();
    writeFileSync(identityPath, JSON.stringify({ schemaVersion: 1, installationId }));
    database
      .prepare(
        `INSERT INTO platform_principals (id, principal_type, username, password_hash, status, failed_login_count, session_version, created_at, updated_at) VALUES (?, 'SYSTEM_OWNER', 'system-owner', ?, 'active', 0, 1, ?, ?)`
      )
      .run(
        randomUUID(),
        await hashPassword("ExistingOwnerPassword2026"),
        now.toISOString(),
        now.toISOString()
      );
    vi.restoreAllMocks();
  });

  afterEach(() => {
    database.exec(`
      DROP TABLE IF EXISTS password_recovery_audit;
      DROP TABLE IF EXISTS password_recovery_requests;
      DROP TABLE IF EXISTS platform_principals;
      DROP TABLE IF EXISTS users;
    `);
  });

  it("creates an installation-bound 24-hour request while storing only the challenge hash", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const code = await runCreateOwnerRecoveryRequest(
      {
        BIOEMS_INSTALLATION_IDENTITY_PATH: identityPath,
        BIOEMS_OWNER_RECOVERY_REQUEST_OUTPUT: outputPath,
      },
      now
    );

    expect(code).toBe(0);
    expect(existsSync(outputPath)).toBe(true);
    const request = JSON.parse(readFileSync(outputPath, "utf8")) as {
      recoveryId: string;
      installationId: string;
      challenge: string;
      requestedAt: string;
    };
    expect(request.installationId).toBe(installationId);
    expect(request.requestedAt).toBe(now.toISOString());
    expect(request.challenge.length).toBeGreaterThanOrEqual(32);

    const row = database
      .prepare(
        `SELECT installation_id, challenge_hash, status, requested_at, expires_at FROM password_recovery_requests WHERE request_id = ?`
      )
      .get(request.recoveryId) as {
      installation_id: string;
      challenge_hash: string;
      status: string;
      requested_at: string;
      expires_at: string;
    };
    expect(row.installation_id).toBe(installationId);
    expect(row.status).toBe("PENDING");
    expect(row.requested_at).toBe(now.toISOString());
    expect(row.expires_at).toBe(new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());
    expect(row.challenge_hash).not.toBe(request.challenge);
    expect(row.challenge_hash).toMatch(/^[a-f0-9]{64}$/);

    const audit = database
      .prepare(
        `SELECT event_type, actor_type, outcome, details_json FROM password_recovery_audit WHERE request_id = ?`
      )
      .get(request.recoveryId);
    const serializedAudit = JSON.stringify(audit);
    expect(audit).toMatchObject({
      event_type: "SYSTEM_OWNER_RECOVERY_REQUESTED",
      actor_type: "LOCAL_INSTALLATION",
      outcome: "SUCCESS",
      details_json: JSON.stringify({ installation_id: installationId }),
    });
    expect(serializedAudit).not.toContain(request.challenge);
    expect(log.mock.calls.flat().join(" ")).not.toContain(request.challenge);
  });

  it("requires an active commissioned SYSTEM_OWNER", async () => {
    database.prepare(`UPDATE platform_principals SET status = 'disabled'`).run();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const code = await runCreateOwnerRecoveryRequest(
      {
        BIOEMS_INSTALLATION_IDENTITY_PATH: identityPath,
        BIOEMS_OWNER_RECOVERY_REQUEST_OUTPUT: outputPath,
      },
      now
    );

    expect(code).toBe(1);
    expect(existsSync(outputPath)).toBe(false);
    expect(
      database.prepare(`SELECT COUNT(*) AS count FROM password_recovery_requests`).get()
    ).toEqual({ count: 0 });
    expect(error).toHaveBeenCalledWith("System Owner recovery request creation failed");
  });

  it("does not overwrite an existing request file", async () => {
    const sentinel = "do-not-overwrite";
    writeFileSync(outputPath, sentinel);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const code = await runCreateOwnerRecoveryRequest(
      {
        BIOEMS_INSTALLATION_IDENTITY_PATH: identityPath,
        BIOEMS_OWNER_RECOVERY_REQUEST_OUTPUT: outputPath,
      },
      now
    );

    expect(code).toBe(1);
    expect(readFileSync(outputPath, "utf8")).toBe(sentinel);
  });
});
