import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createHardwareFingerprint } from "./hardware-fingerprint";
import { InstallationIdentityService } from "./installation-identity.service";
import { provisionInstallationIdentity } from "./installer-integration";
import { AesGcmKeyProtector } from "./key-protection";
import {
  signLicenseCertificate,
  type LicenseClaims,
  type SignedLicenseCertificate,
} from "./license-certificate";
import { validateRuntimeLicense } from "./runtime-license-validator";
import { generateLicenseSigningKey } from "./signing-key-operations";

const fingerprint = (machine = "machine-a", disk = "disk-a") =>
  createHardwareFingerprint({
    machine,
    system: "system-a",
    board: "board-a",
    disk,
    network: "nic-a",
  });

function fixture() {
  const keys = generateKeyPairSync("ed25519");
  const claims: LicenseClaims = {
    schemaVersion: 1,
    licenseId: randomUUID(),
    customerId: 1,
    siteId: 2,
    installationId: randomUUID(),
    hardwareFingerprint: fingerprint(),
    status: "ACTIVE",
    licenseType: "SUBSCRIPTION",
    issuedAt: "2026-09-01T00:00:00.000Z",
    startsAt: "2026-09-01T00:00:00.000Z",
    expiresAt: "2027-09-01T00:00:00.000Z",
    maintenanceUntil: null,
    updateEntitlement: "PAID",
    modules: ["TEMPERATURE"],
    maximumGateways: 2,
    maximumDevices: 10,
    maximumSensors: 30,
    offlineGraceSeconds: 604800,
  };
  const privateKey = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKey = keys.publicKey.export({ type: "spki", format: "pem" }).toString();
  return {
    claims,
    publicKey,
    certificate: signLicenseCertificate(claims, "active-2026", privateKey),
  };
}

describe("LIC-11 installer identity integration", () => {
  it("creates a unique unactivated identity and a secret-free receipt only on a fresh target", () => {
    const directory = mkdtempSync(join(tmpdir(), "bioems-installer-"));
    const protector = new AesGcmKeyProtector(randomBytes(32));
    const input = {
      identityPath: join(directory, "protected", "identity.json"),
      receiptPath: join(directory, "evidence", "provisioning.json"),
      protector,
      now: new Date("2026-09-07T00:00:00.000Z"),
    };
    const receipt = provisionInstallationIdentity(input);
    expect(receipt).toMatchObject({
      state: "NEW_UNACTIVATED_IDENTITY",
      protection: protector.protection,
    });
    expect(readFileSync(input.receiptPath, "utf8")).not.toContain("private");
    expect(() => provisionInstallationIdentity(input)).toThrow("requires a fresh target");

    const secondDirectory = mkdtempSync(join(tmpdir(), "bioems-installer-"));
    const second = provisionInstallationIdentity({
      ...input,
      identityPath: join(secondDirectory, "identity.json"),
      receiptPath: join(secondDirectory, "receipt.json"),
    });
    expect(second.installationId).not.toBe(receipt.installationId);
  });

  it("does not make a copied protected identity usable with another host KEK", () => {
    const source = mkdtempSync(join(tmpdir(), "bioems-copy-source-"));
    const target = mkdtempSync(join(tmpdir(), "bioems-copy-target-"));
    const identityPath = join(source, "identity.json");
    new InstallationIdentityService(identityPath, new AesGcmKeyProtector(randomBytes(32))).create();
    const copiedPath = join(target, "identity.json");
    copyFileSync(identityPath, copiedPath);
    const copied = new InstallationIdentityService(
      copiedPath,
      new AesGcmKeyProtector(randomBytes(32))
    );
    expect(() => copied.loadPrivateKeyDer()).toThrow();
  });
});

describe("LIC-12 anti-tamper and negative qualification", () => {
  it("rejects modified claims, modified signatures and an untrusted signing key", () => {
    const original = fixture();
    const tamperedClaims = structuredClone(original.certificate);
    tamperedClaims.claims.siteId = 99;
    const tamperedSignature = structuredClone(original.certificate);
    tamperedSignature.signature = Buffer.from(randomBytes(64)).toString("base64");
    const otherPublicKey = generateKeyPairSync("ed25519")
      .publicKey.export({ type: "spki", format: "pem" })
      .toString();
    for (const [certificate, publicKey] of [
      [tamperedClaims, original.publicKey],
      [tamperedSignature, original.publicKey],
      [original.certificate, otherPublicKey],
    ] as Array<[SignedLicenseCertificate, string]>) {
      expect(
        validateRuntimeLicense(certificate, publicKey, {
          installationId: original.claims.installationId,
          siteId: original.claims.siteId,
          hardwareFingerprint: fingerprint(),
          now: new Date("2026-10-01"),
        })
      ).toMatchObject({ valid: false, reason: "SIGNATURE", monitoringContinuity: true });
    }
  });

  it.each([
    ["wrong installation", { installationId: randomUUID() }, "INSTALLATION"],
    ["wrong site", { siteId: 3 }, "SITE"],
    ["different host", { hardwareFingerprint: fingerprint("machine-b", "disk-b") }, "HARDWARE"],
  ])("restricts %s while preserving monitoring continuity", (_name, override, reason) => {
    const original = fixture();
    expect(
      validateRuntimeLicense(original.certificate, original.publicKey, {
        installationId: original.claims.installationId,
        siteId: original.claims.siteId,
        hardwareFingerprint: fingerprint(),
        now: new Date("2026-10-01"),
        ...override,
      })
    ).toEqual({ valid: false, mode: "RESTRICTED", reason, monitoringContinuity: true });
  });

  it.each([
    ["SUSPENDED", "STATUS", "2026-10-01"],
    ["REVOKED", "STATUS", "2026-10-01"],
    ["ACTIVE", "NOT_STARTED", "2026-08-01"],
    ["ACTIVE", "EXPIRED", "2027-10-01"],
  ] as const)("restricts %s/date policy as %s", (status, reason, now) => {
    const original = fixture();
    const keys = generateKeyPairSync("ed25519");
    const privateKey = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const publicKey = keys.publicKey.export({ type: "spki", format: "pem" }).toString();
    const certificate = signLicenseCertificate({ ...original.claims, status }, "test", privateKey);
    expect(
      validateRuntimeLicense(certificate, publicKey, {
        installationId: original.claims.installationId,
        siteId: original.claims.siteId,
        hardwareFingerprint: fingerprint(),
        now: new Date(now),
      })
    ).toMatchObject({ valid: false, reason, monitoringContinuity: true });
  });
});

describe("LIC-13 signing-key operations", () => {
  it("creates a non-overwritable offline signing pair without leaking private material", () => {
    const directory = mkdtempSync(join(tmpdir(), "bioems-signing-"));
    const result = generateLicenseSigningKey(
      directory,
      "production-2026-01",
      new Date("2026-09-07")
    );
    expect(readFileSync(result.privateKeyPath, "utf8")).toContain("PRIVATE KEY");
    expect(readFileSync(result.publicKeyPath, "utf8")).not.toContain("PRIVATE KEY");
    expect(readFileSync(result.manifestPath, "utf8")).not.toContain("BEGIN PRIVATE KEY");
    if (process.platform !== "win32")
      expect(statSync(result.privateKeyPath).mode & 0o777).toBe(0o600);
    expect(() => generateLicenseSigningKey(directory, "production-2026-01")).toThrow(
      "already exists"
    );
  });

  it("never prints private material from the command failure path", async () => {
    const { runGenerateLicenseSigningKeyCommand } =
      await import("../../scripts/generate-license-signing-key");
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(runGenerateLicenseSigningKeyCommand({ BIOEMS_SIGNING_KEY_ID: "missing-output" })).toBe(
      1
    );
    expect(error.mock.calls.flat().join(" ")).toBe("License signing key generation failed");
    error.mockRestore();
  });
});
