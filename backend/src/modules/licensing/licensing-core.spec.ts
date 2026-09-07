import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createHardwareFingerprint, compareHardwareFingerprint } from "./hardware-fingerprint";
import { InstallationIdentityService } from "./installation-identity.service";
import { AesGcmKeyProtector } from "./key-protection";
import {
  signLicenseCertificate,
  verifyLicenseCertificate,
  type LicenseClaims,
} from "./license-certificate";
import { validateRuntimeLicense } from "./runtime-license-validator";

const hardware = (disk = "disk-a", machine = "machine-a") =>
  createHardwareFingerprint({
    machine,
    system: "system-a",
    board: "board-a",
    disk,
    network: "nic-a",
  });

describe("LIC-02 installation identity", () => {
  it("persists only a protected private key and restores it with the external KEK", () => {
    const path = join(mkdtempSync(join(tmpdir(), "bioems-identity-")), "identity.json");
    const service = new InstallationIdentityService(path, new AesGcmKeyProtector(randomBytes(32)));
    const identity = service.create(new Date("2026-09-07T00:00:00.000Z"));
    expect(identity.installationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(identity.publicKeyPem).toContain("PUBLIC KEY");
    expect(readFileSync(path, "utf8")).not.toContain("PRIVATE KEY");
    expect(service.loadPrivateKeyDer().length).toBeGreaterThan(32);
    if (process.platform !== "win32") expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(() => service.create()).toThrow();
  });
});

describe("LIC-03 tolerant hardware binding", () => {
  it("tolerates a disk replacement but rejects a materially different host", () => {
    expect(compareHardwareFingerprint(hardware(), hardware("disk-b"))).toMatchObject({
      matches: true,
      score: 85,
    });
    expect(compareHardwareFingerprint(hardware(), hardware("disk-b", "machine-b"))).toMatchObject({
      matches: false,
    });
  });
});

describe("LIC-04 and LIC-06 certificate enforcement", () => {
  const keys = generateKeyPairSync("ed25519");
  const privateKey = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKey = keys.publicKey.export({ type: "spki", format: "pem" }).toString();
  const claims = (): LicenseClaims => ({
    schemaVersion: 1,
    licenseId: randomUUID(),
    customerId: 1,
    siteId: 2,
    installationId: randomUUID(),
    hardwareFingerprint: hardware(),
    status: "ACTIVE",
    licenseType: "SUBSCRIPTION",
    issuedAt: "2026-09-07T00:00:00.000Z",
    startsAt: "2026-09-07T00:00:00.000Z",
    expiresAt: "2027-09-07T00:00:00.000Z",
    maintenanceUntil: null,
    updateEntitlement: "PAID",
    modules: ["TEMPERATURE"],
    maximumGateways: 2,
    maximumDevices: 10,
    maximumSensors: 30,
    offlineGraceSeconds: 604800,
  });

  it("verifies authentic claims and rejects local modification", () => {
    const certificate = signLicenseCertificate(claims(), "primary-2026", privateKey);
    expect(verifyLicenseCertificate(certificate, publicKey).siteId).toBe(2);
    certificate.claims.siteId = 3;
    expect(() => verifyLicenseCertificate(certificate, publicKey)).toThrow(
      "Invalid license certificate signature"
    );
  });

  it("binds runtime use to installation, site and tolerant hardware while preserving monitoring", () => {
    const original = claims();
    const certificate = signLicenseCertificate(original, "primary-2026", privateKey);
    expect(
      validateRuntimeLicense(certificate, publicKey, {
        installationId: original.installationId,
        siteId: 2,
        hardwareFingerprint: hardware("disk-b"),
        now: new Date("2026-10-01"),
      })
    ).toMatchObject({ valid: true });
    expect(
      validateRuntimeLicense(certificate, publicKey, {
        installationId: randomUUID(),
        siteId: 2,
        hardwareFingerprint: hardware(),
        now: new Date("2026-10-01"),
      })
    ).toEqual({
      valid: false,
      mode: "RESTRICTED",
      reason: "INSTALLATION",
      monitoringContinuity: true,
    });
  });
});
