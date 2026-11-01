import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
import { migration036 } from "../../../database/sqlite/migrations/036_main_resilience";
import { migration008 } from "../../../database/sqlite/migrations/008_create_notification_events";
import { FeaturePolicyStore, defaultDevicePolicy } from "./feature-policy";
import { ControllerHealthService } from "./controller-health";
import { decryptRelay, encryptRelay } from "./relay-crypto";
import { DeviceTelemetryService } from "../device-telemetry/device-telemetry.service";

vi.mock("../telemetry/services/telemetry.service", () => ({ TelemetryService: class {} }));
const binding = "11111111-1111-4111-8111-111111111111",
  token = "a".repeat(64);
function database() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE device_platform_bindings(platform_binding_id TEXT PRIMARY KEY,telemetry_token_hash TEXT,
    status TEXT,hardware_uid TEXT,protocol_version TEXT,site_code TEXT,device_identity TEXT);
    INSERT INTO device_platform_bindings VALUES('${binding}','${createHash("sha256").update(token).digest("hex")}',
      'ACTIVE','AABBCCDDEEFF','1.3','MANIAL','D001');`);
  migration008.up(db);
  migration036.up(db);
  return db;
}
describe("Main resilience", () => {
  it("rejects disabling all links, replay without storage, unknown flags and stale writes", () => {
    const db = database(),
      store = new FeaturePolicyStore(db);
    const save = (policy: unknown, expectedRevision = 0) =>
      store.save(binding, { expectedRevision, policy, reason: "Owner test" }, "owner");
    expect(() =>
      save({ ...defaultDevicePolicy, ethernet: false, wifi: false, bluetooth: false })
    ).toThrow();
    expect(() => save({ ...defaultDevicePolicy, offlineStorage: false })).toThrow();
    expect(() => save({ ...defaultDevicePolicy, arbitrary: true })).toThrow();
    expect(save({ ...defaultDevicePolicy, wifi: false }).revision).toBe(1);
    expect(() => save(defaultDevicePolicy)).toThrow(/reload/);
    expect(db.prepare("SELECT * FROM feature_policy_history").all()).toHaveLength(1);
    db.close();
  });
  it("does not create battery or mains alarms for a Main without optional central backup", () => {
    const db = database(),
      service = new ControllerHealthService(db);
    service.accept(binding, {
      timestamp: "2026-10-01T00:00:00Z",
      appliedRevision: 0,
      transport: "ethernet",
      storage: "ready",
      storageUsedPercent: 10,
      queued: 0,
      mains: false,
      batteryLow: true,
    });
    expect(db.prepare("SELECT * FROM controller_health_alarms").all()).toHaveLength(0);
    db.close();
  });
  it("authenticates ciphertext, binding identity, and response request identity", () => {
    const key = createHash("sha256").update(token).digest();
    const encrypted = encryptRelay(binding, { id: "a".repeat(32), accepted: true }, key);
    expect(decryptRelay(encrypted, key)).toEqual({ id: "a".repeat(32), accepted: true });
    expect(() =>
      decryptRelay({ ...encrypted, binding: "22222222-2222-4222-8222-222222222222" }, key)
    ).toThrow();
    expect(() => decryptRelay({ ...encrypted, tag: "0".repeat(32) }, key)).toThrow();
  });
  it("does not invent power state; creates critical transitions once and preserves recovery", () => {
    const db = database(),
      service = new ControllerHealthService(db);
    new FeaturePolicyStore(db).save(
      binding,
      {
        expectedRevision: 0,
        policy: { ...defaultDevicePolicy, centralBatteryInstalled: true },
        reason: "Battery fitted",
      },
      "owner"
    );
    const healthy = {
      timestamp: "2026-10-01T00:00:00Z",
      appliedRevision: 0,
      transport: "ethernet",
      storage: "ready",
      storageUsedPercent: 10,
      queued: 0,
      mains: null,
      batteryLow: null,
    };
    service.accept(binding, healthy);
    expect(db.prepare("SELECT * FROM controller_health_alarms").all()).toHaveLength(0);
    const fault = {
      ...healthy,
      timestamp: "2026-10-01T00:00:01Z",
      mains: false,
      storage: "fault",
      storageUsedPercent: null,
    };
    service.accept(binding, fault);
    service.accept(binding, fault);
    expect(db.prepare("SELECT * FROM controller_health_alarms").all()).toHaveLength(2);
    const events = db.prepare("SELECT payload_json FROM notification_events").all() as {
      payload_json: string;
    }[];
    expect(events.every((e) => JSON.parse(e.payload_json).priority === "HIGHEST")).toBe(true);
    service.accept(binding, { ...healthy, timestamp: "2026-10-01T00:00:02Z", mains: true });
    expect(
      db.prepare("SELECT * FROM controller_health_alarms WHERE status='RECOVERED'").all()
    ).toHaveLength(2);
    service.accept(binding, fault); // stale replay cannot resurrect recovered incidents.
    expect(
      db.prepare("SELECT * FROM controller_health_alarms WHERE status='TRIGGERED'").all()
    ).toHaveLength(0);
    db.close();
  });
  it("acknowledges repeated samples without writing telemetry twice and rejects ID conflicts", async () => {
    const db = database(),
      process = vi.fn(async () => true),
      service = new DeviceTelemetryService(db, { process });
    const payload = {
      sampleId: "a".repeat(32),
      timestamp: "2026-10-01T00:00:00Z",
      mode: "LIVE",
      sensors: [{ channel: 1, value: 4 }],
    };
    expect(await service.accept(binding, token, payload)).toBe(true);
    expect(await service.accept(binding, token, { ...payload, mode: "REPLAY" })).toBe(true);
    expect(process).toHaveBeenCalledTimes(1);
    await expect(
      service.accept(binding, token, { ...payload, sensors: [{ channel: 1, value: 5 }] })
    ).rejects.toThrow(/reused/);
    db.close();
  });
});
