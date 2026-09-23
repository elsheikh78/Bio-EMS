import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration030 } from "../../../database/sqlite/migrations/030_create_device_platform_pairing";
import { AppError } from "../../errors/app-error";
import { DevicePairingService } from "./device-pairing.service";

describe("DevicePairingService", () => {
  let database: Database.Database;
  let now: Date;
  let service: DevicePairingService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE platform_installations (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL
      );
      CREATE TABLE platform_installation_revisions (
        id INTEGER PRIMARY KEY,
        installation_id INTEGER NOT NULL,
        revision INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        snapshot_json TEXT NOT NULL
      );
      CREATE TABLE platform_installation_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        installation_id INTEGER NOT NULL,
        revision_id INTEGER,
        event_type TEXT NOT NULL,
        actor_identity TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        evidence_json TEXT NOT NULL
      );
    `);
    migration030.up(database);
    now = new Date("2026-09-23T17:00:00.000Z");
    service = new DevicePairingService(database, () => now);

    database
      .prepare("INSERT INTO platform_installations(id,uuid,status) VALUES(1,?,'SENT')")
      .run("11111111-1111-4111-8111-111111111111");
    database
      .prepare(
        "INSERT INTO platform_installation_revisions(id,installation_id,revision,checksum,snapshot_json) VALUES(1,1,3,?,?)"
      )
      .run(
        "a".repeat(64),
        JSON.stringify({
          companyName: "BIO EGYPT",
          sites: [
            {
              code: "MANIAL",
              name: "Manial",
              timezone: "Africa/Cairo",
              areas: [
                {
                  code: "CR1",
                  name: "Cold Room 1",
                  telemetries: [
                    {
                      code: "T1",
                      name: "Temperature 1",
                      type: "TEMPERATURE",
                      unit: "°C",
                      warningDelaySeconds: 0,
                      criticalDelaySeconds: 0,
                      calibrationOffset: 0,
                    },
                  ],
                },
              ],
            },
          ],
          devices: [
            {
              deviceId: "CTRL-001",
              siteCode: "MANIAL",
              type: "zone-controller",
              protocol: "mqtt",
              firmwareVersion: "0.1.0-pilot.1",
              mappings: [{ areaCode: "CR1", telemetryCode: "T1", channel: 0 }],
            },
          ],
        })
      );
  });

  afterEach(() => database.close());

  it("issues a short-lived numeric code and persists only its hash", () => {
    const issued = service.issuePairingCode(
      "11111111-1111-4111-8111-111111111111",
      "CTRL-001",
      "system-owner#owner"
    );

    expect(issued.pairing_code).toMatch(/^\d{12}$/);
    expect(issued.binding_schema_version).toBe(1);
    const stored = database
      .prepare("SELECT code_hash AS codeHash,status FROM device_pairing_sessions")
      .get() as { codeHash: string; status: string };
    expect(stored.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.codeHash).not.toBe(issued.pairing_code);
    expect(stored.status).toBe("PENDING");
  });

  it("claims the code once and creates one stable installation/device binding", () => {
    const issued = service.issuePairingCode(
      "11111111-1111-4111-8111-111111111111",
      "CTRL-001",
      "system-owner#owner"
    );

    const claimed = service.claim({
      pairing_code: issued.pairing_code,
      hardware_uid: "AABBCCDDEEFF",
      firmware_version: "0.1.0-pilot.1",
      protocol_version: "1.3",
      binding_schema_version: 1,
    });

    expect(claimed.platform_binding_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(claimed.installation_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(claimed.device_id).toBe("CTRL-001");
    expect(claimed.site_code).toBe("MANIAL");
    expect(claimed.configuration).toMatchObject({
      revision: 3,
      checksum: "a".repeat(64),
    });
    expect(claimed.mqtt.telemetry_topic).toBe("bioems/MANIAL/telemetry/CTRL-001");

    const binding = database
      .prepare(
        "SELECT hardware_uid AS hardwareUid,status,binding_schema_version AS schemaVersion FROM device_platform_bindings"
      )
      .get() as { hardwareUid: string; status: string; schemaVersion: number };
    expect(binding).toEqual({
      hardwareUid: "AABBCCDDEEFF",
      status: "ACTIVE",
      schemaVersion: 1,
    });

    expect(() =>
      service.claim({
        pairing_code: issued.pairing_code,
        hardware_uid: "AABBCCDDEEFF",
        firmware_version: "0.1.0-pilot.1",
        protocol_version: "1.3",
        binding_schema_version: 1,
      })
    ).toThrowError(AppError);
  });

  it("rejects a controller firmware or protocol that does not match the installation contract", () => {
    const issued = service.issuePairingCode(
      "11111111-1111-4111-8111-111111111111",
      "CTRL-001",
      "system-owner#owner"
    );

    expect(() =>
      service.claim({
        pairing_code: issued.pairing_code,
        hardware_uid: "AABBCCDDEEFF",
        firmware_version: "0.2.0",
        protocol_version: "1.3",
        binding_schema_version: 1,
      })
    ).toThrowError(/firmware/i);
  });

  it("expires the code after ten minutes", () => {
    const issued = service.issuePairingCode(
      "11111111-1111-4111-8111-111111111111",
      "CTRL-001",
      "system-owner#owner"
    );
    now = new Date("2026-09-23T17:10:00.000Z");

    expect(() =>
      service.claim({
        pairing_code: issued.pairing_code,
        hardware_uid: "AABBCCDDEEFF",
        firmware_version: "0.1.0-pilot.1",
        protocol_version: "1.3",
        binding_schema_version: 1,
      })
    ).toThrowError(/expired/i);

    const row = database.prepare("SELECT status FROM device_pairing_sessions").get() as {
      status: string;
    };
    expect(row.status).toBe("EXPIRED");
  });

  it("refuses a second active binding for the same installation device", () => {
    const issued = service.issuePairingCode(
      "11111111-1111-4111-8111-111111111111",
      "CTRL-001",
      "system-owner#owner"
    );
    service.claim({
      pairing_code: issued.pairing_code,
      hardware_uid: "AABBCCDDEEFF",
      firmware_version: "0.1.0-pilot.1",
      protocol_version: "1.3",
      binding_schema_version: 1,
    });

    expect(() =>
      service.issuePairingCode(
        "11111111-1111-4111-8111-111111111111",
        "CTRL-001",
        "system-owner#owner"
      )
    ).toThrowError(AppError);
  });
});
