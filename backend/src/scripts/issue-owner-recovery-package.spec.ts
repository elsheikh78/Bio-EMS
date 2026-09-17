import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyOwnerRecoveryPackage } from "../modules/platform-auth/owner-recovery";
import { runIssueOwnerRecoveryPackage } from "./issue-owner-recovery-package";

const temporaryDirectories: string[] = [];

function createFixture() {
  const directory = mkdtempSync(join(tmpdir(), "bioems-owner-recovery-"));
  temporaryDirectories.push(directory);
  const requestPath = join(directory, "request.json");
  const privateKeyPath = join(directory, "manufacturer-private.pem");
  const outputPath = join(directory, "package.json");
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
  writeFileSync(requestPath, JSON.stringify(request));
  writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
  return { requestPath, privateKeyPath, outputPath, privateKey, publicKey, request };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("offline System Owner recovery package issuance", () => {
  it("creates an installation-bound signed package without plaintext password or private key", async () => {
    const fixture = createFixture();
    const password = "RecoveredOwnerPassword2026";
    const now = new Date("2026-09-17T20:00:00.000Z");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const code = await runIssueOwnerRecoveryPackage(
      {
        BIOEMS_OWNER_RECOVERY_REQUEST: fixture.requestPath,
        BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY: fixture.privateKeyPath,
        BIOEMS_OWNER_RECOVERY_PACKAGE_OUTPUT: fixture.outputPath,
        BIOEMS_OWNER_COMMISSIONING_KEY_ID: "owner-key-2026",
        BIOEMS_OWNER_RECOVERY_PASSWORD: password,
        BIOEMS_OWNER_RECOVERY_VALIDITY_MINUTES: "15",
      },
      now
    );

    expect(code).toBe(0);
    expect(error).not.toHaveBeenCalled();
    const output = readFileSync(fixture.outputPath, "utf8");
    expect(output).not.toContain(password);
    expect(output).not.toContain(fixture.privateKey);
    expect(log.mock.calls.flat().join(" ")).not.toContain(password);
    expect(log.mock.calls.flat().join(" ")).not.toContain(fixture.privateKey);

    const signed = JSON.parse(output);
    const verified = verifyOwnerRecoveryPackage(signed, fixture.publicKey, fixture.request, now);
    expect(verified.installationId).toBe(fixture.request.installationId);
    expect(verified.recoveryId).toBe(fixture.request.recoveryId);
    expect(verified.purpose).toBe("SYSTEM_OWNER_PASSWORD_RECOVERY");
  });

  it("rejects stale requests, invalid validity, weak passwords, and existing output without leaking secrets", async () => {
    const fixture = createFixture();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const base = {
      BIOEMS_OWNER_RECOVERY_REQUEST: fixture.requestPath,
      BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY: fixture.privateKeyPath,
      BIOEMS_OWNER_RECOVERY_PACKAGE_OUTPUT: fixture.outputPath,
      BIOEMS_OWNER_COMMISSIONING_KEY_ID: "owner-key-2026",
      BIOEMS_OWNER_RECOVERY_PASSWORD: "RecoveredOwnerPassword2026",
      BIOEMS_OWNER_RECOVERY_VALIDITY_MINUTES: "15",
    };

    expect(
      await runIssueOwnerRecoveryPackage(base, new Date("2026-09-18T20:00:01.000Z"))
    ).toBe(1);
    expect(
      await runIssueOwnerRecoveryPackage(
        { ...base, BIOEMS_OWNER_RECOVERY_VALIDITY_MINUTES: "61" },
        new Date("2026-09-17T20:00:00.000Z")
      )
    ).toBe(1);
    expect(
      await runIssueOwnerRecoveryPackage(
        { ...base, BIOEMS_OWNER_RECOVERY_PASSWORD: "weak" },
        new Date("2026-09-17T20:00:00.000Z")
      )
    ).toBe(1);

    writeFileSync(fixture.outputPath, "existing");
    expect(
      await runIssueOwnerRecoveryPackage(base, new Date("2026-09-17T20:00:00.000Z"))
    ).toBe(1);
    expect(error.mock.calls.flat().join(" ")).not.toContain(base.BIOEMS_OWNER_RECOVERY_PASSWORD);
    expect(error.mock.calls.flat().join(" ")).not.toContain(fixture.privateKey);
  });
});
