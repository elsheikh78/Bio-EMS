import Database from "better-sqlite3";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTables } from "../../../database/sqlite/schema";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration020 } from "../../../database/sqlite/migrations/020_create_installation_lifecycle";
import { migration022 } from "../../../database/sqlite/migrations/022_create_site_bound_licensing_domain";
import { migration023 } from "../../../database/sqlite/migrations/023_create_licensing_activation_workflow";
import { ActivationService } from "./activation.service";
import { createHardwareFingerprint } from "./hardware-fingerprint";
import { LicensingRepository } from "./licensing.repository";
import { verifyLicenseCertificate } from "./license-certificate";

describe("LIC-05 activation workflow", () => {
  let database: Database.Database;
  const signing = generateKeyPairSync("ed25519");
  const privateKeyPem = signing.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKeyPem = signing.publicKey.export({ type: "spki", format: "pem" }).toString();

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    createTables(database);
    migration018.up(database);
    migration020.up(database);
    migration022.up(database);
    migration023.up(database);
    database
      .prepare(
        "INSERT INTO platform_customers (id,code,name,status,created_at,created_by) VALUES (1,'C1','Customer','ACTIVE','now','owner')"
      )
      .run();
    database.prepare("INSERT INTO sites (id,code,name) VALUES (2,'S2','Site')").run();
  });
  afterEach(() => database.close());

  it("records a request and atomically issues an immutable signed certificate", () => {
    const repository = new LicensingRepository(database);
    const service = new ActivationService(repository, { keyId: "primary-2026", privateKeyPem });
    const requestId = randomUUID();
    const installationId = randomUUID();
    service.request({
      requestId,
      installationId,
      customerId: 1,
      siteId: 2,
      publicKeyPem,
      hardwareFingerprint: createHardwareFingerprint({
        machine: "m",
        system: "s",
        board: "b",
        disk: "d",
      }),
      requestedAt: "2026-09-07T00:00:00.000Z",
    });
    const certificate = service.approve(
      requestId,
      {
        licenseId: randomUUID(),
        licenseType: "SUBSCRIPTION",
        startsAt: "2026-09-07T00:00:00.000Z",
        expiresAt: "2027-09-07T00:00:00.000Z",
        maintenanceUntil: null,
        updateEntitlement: "PAID",
        modules: ["TEMPERATURE"],
        maximumGateways: 1,
        maximumDevices: 5,
        maximumSensors: 20,
        offlineGraceSeconds: 604800,
      },
      "owner#1",
      new Date("2026-09-07T01:00:00.000Z")
    );

    expect(verifyLicenseCertificate(certificate, publicKeyPem).installationId).toBe(installationId);
    expect(database.prepare("SELECT status FROM license_activation_requests").get()).toEqual({
      status: "APPROVED",
    });
    expect(database.prepare("SELECT status FROM licensing_installations").get()).toEqual({
      status: "ACTIVE",
    });
    expect(() =>
      database.prepare("UPDATE signed_license_certificates SET key_id='other'").run()
    ).toThrow("signed license certificates are immutable");
  });
});
