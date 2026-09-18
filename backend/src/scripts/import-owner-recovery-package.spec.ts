import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signOwnerRecoveryPackage } from "../modules/platform-auth/owner-recovery";
import { hashPassword } from "../services/password.service";
import { runImportOwnerRecoveryPackage } from "./import-owner-recovery-package";

const temporaryDirectories: string[] = [];

function createFixture() {
  const directory = mkdtempSync(join(tmpdir(), "bioems-owner-recovery-import-"));
  temporaryDirectories.push(directory);
  const identityPath = join(directory, "installation-identity.json");
  const requestPath = join(directory, "request.json");
  const packagePath = join(directory, "package.json");
  const installationId = randomUUID();
  const recoveryId = randomUUID();
  const challenge = "owner-recovery-challenge-0123456789abcdef";
  const pair = generateKeyPairSync("ed25519");
  const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
  const request = {
    schemaVersion: 1 as const,
    recoveryId,
    installationId,
    challenge,
    requestedAt: "2026-09-17T19:55:00.000Z",
  };
  writeFileSync(identityPath, JSON.stringify({ schemaVersion: 1, installationId }));
  writeFileSync(requestPath, JSON.stringify(request));
  writeFileSync(
    join(directory, "manufacturer-owner-trust.json"),
    JSON.stringify({
      schemaVersion: 1,
      keys: [{ keyId: "owner-key-2026", publicKeyPem: publicKey, status: "active" }],
    })
  );
  return { identityPath, requestPath, packagePath, privateKey, request };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("System Owner recovery package import boundary", () => {
  it("rejects a request belonging to another installation before recovery is applied", async () => {
    const fixture = createFixture();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    writeFileSync(
      fixture.identityPath,
      JSON.stringify({ schemaVersion: 1, installationId: randomUUID() })
    );
    writeFileSync(fixture.packagePath, "{}");

    const code = await runImportOwnerRecoveryPackage({
      BIOEMS_INSTALLATION_IDENTITY_PATH: fixture.identityPath,
      BIOEMS_OWNER_RECOVERY_REQUEST: fixture.requestPath,
      BIOEMS_OWNER_RECOVERY_PACKAGE: fixture.packagePath,
    });

    expect(code).toBe(1);
    expect(error).toHaveBeenCalledWith("System Owner recovery package rejected");
  });

  it("rejects a tampered signed package and does not leak the recovery password or private key", async () => {
    const fixture = createFixture();
    const password = "RecoveredOwnerPassword2026";
    const now = new Date("2026-09-17T20:00:00.000Z");
    const claims = {
      schemaVersion: 1 as const,
      purpose: "SYSTEM_OWNER_PASSWORD_RECOVERY" as const,
      recoveryId: fixture.request.recoveryId,
      installationId: fixture.request.installationId,
      challengeHash: (await import("../modules/platform-auth/owner-recovery")).hashOwnerRecoveryChallenge(
        fixture.request.challenge
      ),
      passwordHash: await hashPassword(password),
      issuedAt: "2026-09-17T19:59:00.000Z",
      expiresAt: "2026-09-17T20:10:00.000Z",
    };
    const signed = signOwnerRecoveryPackage(claims, "owner-key-2026", fixture.privateKey);
    writeFileSync(
      fixture.packagePath,
      JSON.stringify({
        ...signed,
        claims: { ...signed.claims, installationId: randomUUID() },
      })
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const code = await runImportOwnerRecoveryPackage(
      {
        BIOEMS_INSTALLATION_IDENTITY_PATH: fixture.identityPath,
        BIOEMS_OWNER_RECOVERY_REQUEST: fixture.requestPath,
        BIOEMS_OWNER_RECOVERY_PACKAGE: fixture.packagePath,
      },
      now
    );

    expect(code).toBe(1);
    const errors = error.mock.calls.flat().join(" ");
    expect(errors).toBe("System Owner recovery package rejected");
    expect(errors).not.toContain(password);
    expect(errors).not.toContain(fixture.privateKey);
  });
});
