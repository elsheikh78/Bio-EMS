import { generateKeyPairSync, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration009 } from "../../../database/sqlite/migrations/009_create_platform_principals";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { migration025 } from "../../../database/sqlite/migrations/025_create_owner_commissioning_receipts";
import { hashPassword } from "../../services/password.service";
import {
  applyOwnerCommissioning,
  OwnerCommissioningClaims,
  signOwnerCommissioningPackage,
  verifyOwnerCommissioningPackage,
} from "./owner-commissioning";

describe("owner commissioning", () => {
  let database: Database.Database;
  const installationId = randomUUID();
  const now = new Date("2026-09-14T12:00:00.000Z");
  const pair = generateKeyPairSync("ed25519");
  const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec("PRAGMA foreign_keys = ON");
    migration009.up(database);
    migration010.up(database);
    migration025.up(database);
  });

  afterEach(() => database.close());

  async function claims(): Promise<OwnerCommissioningClaims> {
    return {
      schemaVersion: 1,
      commissioningId: randomUUID(),
      installationId,
      username: "system-owner",
      passwordHash: await hashPassword("OwnerPassword2026"),
      issuedAt: "2026-09-14T11:55:00.000Z",
      expiresAt: "2026-09-14T12:10:00.000Z",
      mfaEnrollmentRequired: true,
    };
  }

  it("verifies and atomically provisions one owner with immutable receipt and audit", async () => {
    const signed = signOwnerCommissioningPackage(await claims(), "owner-key-2026", privateKey);
    const verified = verifyOwnerCommissioningPackage(signed, publicKey, installationId, now);
    const ownerId = applyOwnerCommissioning(database, verified, signed.keyId, now);

    expect(
      database.prepare("SELECT username, status FROM platform_principals WHERE id = ?").get(ownerId)
    ).toEqual({ username: "system-owner", status: "active" });
    expect(
      database.prepare("SELECT commissioning_id FROM owner_commissioning_receipts").get()
    ).toEqual({ commissioning_id: signed.claims.commissioningId });
    expect(database.prepare("SELECT action, result FROM audit_events").get()).toEqual({
      action: "SYSTEM_OWNER_COMMISSIONED",
      result: "SUCCESS",
    });
    expect(() =>
      database.prepare("DELETE FROM owner_commissioning_receipts").run()
    ).toThrow(/immutable/);
  });

  it("rejects tampering, wrong installation, expiry, and replay", async () => {
    const signed = signOwnerCommissioningPackage(await claims(), "owner-key-2026", privateKey);

    expect(() =>
      verifyOwnerCommissioningPackage(
        { ...signed, claims: { ...signed.claims, username: "attacker" } },
        publicKey,
        installationId,
        now
      )
    ).toThrow(/signature/);
    expect(() =>
      verifyOwnerCommissioningPackage(signed, publicKey, randomUUID(), now)
    ).toThrow(/different installation/);
    expect(() =>
      verifyOwnerCommissioningPackage(
        signed,
        publicKey,
        installationId,
        new Date("2026-09-14T12:11:00.000Z")
      )
    ).toThrow(/not currently valid/);

    const verified = verifyOwnerCommissioningPackage(signed, publicKey, installationId, now);
    applyOwnerCommissioning(database, verified, signed.keyId, now);
    expect(() => applyOwnerCommissioning(database, verified, signed.keyId, now)).toThrow(
      /already been used/
    );
  });
});
