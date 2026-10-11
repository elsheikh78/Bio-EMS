import { generateKeyPairSync, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration033 } from "../../../database/sqlite/migrations/033_create_admin_offline_recovery";
import { AdminRecoveryService } from "./admin-recovery.service";
import { issueAdminRecoveryPermit, recoveryHash } from "./admin-recovery.domain";
import { hashPassword, verifyPassword } from "../../services/password.service";
const keys = generateKeyPairSync("ed25519", {
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
    cipher: "aes-256-cbc",
    passphrase: "test-passphrase",
  },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const identity = {
  installationId: randomUUID(),
  customer: { name: "Customer", code: "C1" },
  site: { name: "Site", code: "S1" },
};
let database: Database.Database;
let service: AdminRecoveryService;
let now: Date;
let trust: {
  schemaVersion: number;
  keys: { keyId: string; status: string; publicKeyPem: string }[];
};
let originalHash: string;
const permit = (request: unknown) =>
  issueAdminRecoveryPermit(request, "admin-test-key", keys.privateKey, "test-passphrase", 60, now);
beforeEach(async () => {
  now = new Date("2026-10-11T12:00:00.000Z");
  trust = {
    schemaVersion: 1,
    keys: [{ keyId: "admin-test-key", status: "active", publicKeyPem: keys.publicKey }],
  };
  database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT UNIQUE,password_hash TEXT,role TEXT,status TEXT,password_change_required INTEGER DEFAULT 0,updated_at TEXT);
    CREATE TABLE password_recovery_audit(id INTEGER PRIMARY KEY,event_type TEXT,request_id TEXT,principal_type TEXT,principal_id INTEGER,actor_type TEXT,actor_id TEXT,outcome TEXT,details_json TEXT);`);
  migration033.up(database);
  originalHash = await hashPassword("OriginalPass1!");
  database
    .prepare(
      "INSERT INTO users(id,username,password_hash,role,status) VALUES(1,'admin',?,'ADMIN','active')"
    )
    .run(originalHash);
  service = new AdminRecoveryService(
    database,
    () => identity,
    () => trust,
    () => now
  );
});
afterEach(() => database.close());
describe("offline customer ADMIN recovery", () => {
  it("runs request -> encrypted-key signing -> restricted grant -> new password exactly once", async () => {
    const signed = permit(service.request(" ADMIN "));
    expect(JSON.stringify(signed)).not.toMatch(/passwordHash|PRIVATE KEY|OriginalPass/);
    const grant = service.authorize(signed);
    await service.complete(grant.recoveryToken, "ReplacementPass2!");
    const result = database.prepare("SELECT password_hash FROM users WHERE id=1").get() as {
      password_hash: string;
    };
    expect(await verifyPassword("ReplacementPass2!", result.password_hash)).toBe(true);
    expect(await verifyPassword("OriginalPass1!", result.password_hash)).toBe(false);
    expect(() => service.authorize(signed)).toThrow();
    await expect(service.complete(grant.recoveryToken, "ReplacementPass3!")).rejects.toThrow();
    expect(database.prepare("SELECT status,grant_hash FROM admin_offline_recovery").get()).toEqual({
      status: "CONSUMED",
      grant_hash: null,
    });
    const audit = JSON.stringify(database.prepare("SELECT * FROM password_recovery_audit").all());
    expect(audit).not.toContain(grant.recoveryToken);
    expect(audit).not.toContain("ReplacementPass2!");
  });
  it.each([
    "tamper",
    "installation",
    "account",
    "request",
    "challenge",
    "unknown-key",
    "revoked-key",
    "expired",
  ])("rejects %s permits", (change) => {
    const request = service.request("admin");
    let signed = permit(request);
    if (change === "tamper") signed.claims.username = "changed";
    if (change === "installation") signed = permit({ ...request, installationId: randomUUID() });
    if (change === "account") signed = permit({ ...request, username: "other-admin" });
    if (change === "request") signed = permit({ ...request, requestId: randomUUID() });
    if (change === "challenge") signed = permit({ ...request, challenge: "x".repeat(43) });
    if (change === "unknown-key") signed.keyId = "unknown-key";
    if (change === "revoked-key") trust.keys[0].status = "revoked";
    if (change === "expired") now = new Date(now.getTime() + 61 * 60_000);
    expect(() => service.authorize(signed)).toThrow();
  });
  it("rejects another installation even with a copied pending database", () => {
    const signed = permit(service.request("admin"));
    const other = new AdminRecoveryService(
      database,
      () => ({ ...identity, installationId: randomUUID() }),
      () => trust,
      () => now
    );
    expect(() => other.authorize(signed)).toThrow();
  });
  it.each(["unknown", "operator", "disabled"])(
    "does not authorize %s accounts or reveal eligibility in exported shape",
    (username) => {
      database
        .prepare(
          "INSERT INTO users(id,username,password_hash,role,status) VALUES(2,'operator',?,'OPERATOR','active')"
        )
        .run(originalHash);
      database
        .prepare(
          "INSERT INTO users(id,username,password_hash,role,status) VALUES(3,'disabled',?,'ADMIN','disabled')"
        )
        .run(originalHash);
      const request = service.request(username);
      expect(Object.keys(request)).toEqual(Object.keys(service.request("admin")));
      expect(() => service.authorize(permit(request))).toThrow();
    }
  );
  it("does not consume on invalid password and rejects expired restricted grants", async () => {
    const grant = service.authorize(permit(service.request("admin")));
    await expect(service.complete(grant.recoveryToken, "weak")).rejects.toThrow();
    expect(database.prepare("SELECT grant_hash FROM admin_offline_recovery").get()).toEqual({
      grant_hash: recoveryHash(grant.recoveryToken),
    });
    now = new Date(now.getTime() + 11 * 60_000);
    await expect(service.complete(grant.recoveryToken, "ReplacementPass2!")).rejects.toThrow();
  });
  it("invalidates pending permits after a separate password reset", () => {
    const signed = permit(service.request("admin"));
    database.prepare("UPDATE users SET password_hash='changed' WHERE id=1").run();
    expect(() => service.authorize(signed)).toThrow();
  });
  it("checks key revocation again on completion", async () => {
    const grant = service.authorize(permit(service.request("admin")));
    trust.keys[0].status = "revoked";
    await expect(service.complete(grant.recoveryToken, "ReplacementPass2!")).rejects.toThrow();
  });
  it("rejects cross-purpose and future/stale requests", () => {
    const request = service.request("admin");
    expect(() => permit({ ...request, purpose: "SYSTEM_OWNER_PASSWORD_RECOVERY" })).toThrow();
    expect(() => permit({ ...request, requestedAt: "2099-01-01T00:00:00.000Z" })).toThrow();
    expect(() => permit({ ...request, expiresAt: "2026-10-10T00:00:00.000Z" })).toThrow();
    expect(() =>
      issueAdminRecoveryPermit(request, "admin-test-key", "plaintext", "test")
    ).toThrow();
  });
});
