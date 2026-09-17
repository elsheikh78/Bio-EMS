import { generateKeyPairSync, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration009 } from "../../../database/sqlite/migrations/009_create_platform_principals";
import { migration027 } from "../../../database/sqlite/migrations/027_create_password_recovery_domain";
import { hashPassword } from "../../services/password.service";
import {
  applyOwnerRecovery,
  hashOwnerRecoveryChallenge,
  OwnerRecoveryClaims,
  OwnerRecoveryRequest,
  signOwnerRecoveryPackage,
  verifyOwnerRecoveryPackage,
} from "./owner-recovery";

describe("system owner recovery", () => {
  let database: Database.Database;
  const installationId = randomUUID();
  const recoveryId = randomUUID();
  const challenge = "owner-recovery-challenge-0123456789abcdef";
  const now = new Date("2026-09-17T20:00:00.000Z");
  const pair = generateKeyPairSync("ed25519");
  const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();

  const request: OwnerRecoveryRequest = {
    schemaVersion: 1,
    recoveryId,
    installationId,
    challenge,
    requestedAt: "2026-09-17T19:55:00.000Z",
  };

  beforeEach(async () => {
    database = new Database(":memory:");
    migration009.up(database);
    migration027.up(database);
    database
      .prepare(
        `INSERT INTO platform_principals (id, principal_type, username, password_hash, status, mfa_enabled, failed_login_count, session_version, created_at, updated_at) VALUES (?, 'SYSTEM_OWNER', 'system-owner', ?, 'active', 1, 3, 7, ?, ?)`
      )
      .run(
        randomUUID(),
        await hashPassword("PreviousOwnerPassword2026"),
        now.toISOString(),
        now.toISOString()
      );
    database
      .prepare(
        `INSERT INTO password_recovery_requests (request_id, principal_type, installation_id, challenge_hash, status, requested_at, expires_at) VALUES (?, 'SYSTEM_OWNER', ?, ?, 'PENDING', ?, ?)`
      )
      .run(
        recoveryId,
        installationId,
        hashOwnerRecoveryChallenge(challenge),
        request.requestedAt,
        "2026-09-18T19:55:00.000Z"
      );
  });

  afterEach(() => database.close());

  async function claims(): Promise<OwnerRecoveryClaims> {
    return {
      schemaVersion: 1,
      purpose: "SYSTEM_OWNER_PASSWORD_RECOVERY",
      recoveryId,
      installationId,
      challengeHash: hashOwnerRecoveryChallenge(challenge),
      passwordHash: await hashPassword("RecoveredOwnerPassword2026"),
      issuedAt: "2026-09-17T19:59:00.000Z",
      expiresAt: "2026-09-17T20:10:00.000Z",
    };
  }

  it("verifies and atomically consumes a manufacturer-signed recovery package", async () => {
    const signed = signOwnerRecoveryPackage(await claims(), "owner-key-2026", privateKey);
    const verified = verifyOwnerRecoveryPackage(signed, publicKey, request, now);

    applyOwnerRecovery(database, verified, signed.keyId, now);

    const owner = database
      .prepare(
        `SELECT failed_login_count, locked_until, session_version, mfa_enabled FROM platform_principals WHERE principal_type = 'SYSTEM_OWNER'`
      )
      .get();
    expect(owner).toEqual({
      failed_login_count: 0,
      locked_until: null,
      session_version: 8,
      mfa_enabled: 1,
    });
    expect(
      database
        .prepare(`SELECT status, consumed_at FROM password_recovery_requests WHERE request_id = ?`)
        .get(recoveryId)
    ).toMatchObject({ status: "CONSUMED", consumed_at: now.toISOString() });
    expect(
      database
        .prepare(
          `SELECT event_type, actor_type, actor_id, outcome, details_json FROM password_recovery_audit WHERE request_id = ?`
        )
        .get(recoveryId)
    ).toEqual({
      event_type: "SYSTEM_OWNER_PASSWORD_RECOVERED",
      actor_type: "MANUFACTURER_SIGNING_AUTHORITY",
      actor_id: "owner-key-2026",
      outcome: "SUCCESS",
      details_json: JSON.stringify({ installation_id: installationId }),
    });
  });

  it("rejects tampering, wrong installation, challenge mismatch, expiry, and replay", async () => {
    const signed = signOwnerRecoveryPackage(await claims(), "owner-key-2026", privateKey);

    expect(() =>
      verifyOwnerRecoveryPackage(
        {
          ...signed,
          claims: { ...signed.claims, installationId: randomUUID() },
        },
        publicKey,
        request,
        now
      )
    ).toThrow(/signature/);

    const wrongInstallation = { ...request, installationId: randomUUID() };
    expect(() => verifyOwnerRecoveryPackage(signed, publicKey, wrongInstallation, now)).toThrow(
      /does not match this request/
    );

    const wrongChallenge = { ...request, challenge: `${challenge}-changed` };
    expect(() => verifyOwnerRecoveryPackage(signed, publicKey, wrongChallenge, now)).toThrow(
      /challenge mismatch/
    );

    expect(() =>
      verifyOwnerRecoveryPackage(signed, publicKey, request, new Date("2026-09-17T20:10:00.000Z"))
    ).toThrow(/not currently valid/);

    const verified = verifyOwnerRecoveryPackage(signed, publicKey, request, now);
    applyOwnerRecovery(database, verified, signed.keyId, now);
    expect(() => applyOwnerRecovery(database, verified, signed.keyId, now)).toThrow(
      /unavailable or already used/
    );
  });
});
