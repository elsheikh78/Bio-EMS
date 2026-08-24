import { describe, expect, it } from "vitest";
import {
  createConfigDeliveryEnvelope,
  evaluateConfigSync,
  safeFallback,
  verifyConfigDeliveryEnvelope,
} from "./offline-critical-config.contract";

const siteUuid = "e70cb67a-0ab0-4e57-ac61-d6142990ca37";
const recipientUuid = "b3d90e36-faf5-4a46-96dc-376dbc1475cb";
const bundle = {
  contract_version: 1 as const,
  config_version: 4,
  site_uuid: siteUuid,
  issued_at: "2026-08-24T08:00:00Z",
  sensors: [
    {
      sensor_uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
      device_id: "ZC-FW-001",
      channel: 1,
      enabled: true as const,
      alarm_low: 2,
      alarm_high: 8,
      critical_delay_seconds: 30,
    },
  ],
  sms_failover: { enabled: true, primary_unavailable_after_seconds: 300 },
  sms_targets: [{ recipient_uuid: recipientUuid, sms_address: "+201001234567" }],
  critical_escalation_steps: [{ position: 1, delay_seconds: 0, recipient_uuid: recipientUuid }],
};

describe("offline-critical controller configuration contract", () => {
  it("creates and verifies a deterministic versioned checksum envelope", () => {
    const first = createConfigDeliveryEnvelope(bundle);
    const second = createConfigDeliveryEnvelope(bundle);
    expect(first).toEqual(second);
    expect(verifyConfigDeliveryEnvelope(first)).toEqual(first);
    expect(() =>
      verifyConfigDeliveryEnvelope({ ...first, checksum_sha256: "0".repeat(64) })
    ).toThrow("checksum");
  });
  it("rejects unsafe or internally inconsistent minimum subsets", () => {
    expect(() => createConfigDeliveryEnvelope({ ...bundle, sms_targets: [] })).toThrow();
    expect(() =>
      createConfigDeliveryEnvelope({
        ...bundle,
        critical_escalation_steps: [
          { position: 2, delay_seconds: 0, recipient_uuid: recipientUuid },
        ],
      })
    ).toThrow();
    expect(() =>
      createConfigDeliveryEnvelope({
        ...bundle,
        sensors: [{ ...bundle.sensors[0], alarm_low: 9, alarm_high: 8 }],
      })
    ).toThrow();
  });
  it("distinguishes current, stale, rejected, mismatched, and ahead acknowledgements", () => {
    const envelope = createConfigDeliveryEnvelope(bundle);
    const ack = {
      controller_id: "CTRL-1",
      site_uuid: siteUuid,
      config_version: 4,
      checksum_sha256: envelope.checksum_sha256,
      acknowledged_at: "2026-08-24T08:01:00Z",
      status: "APPLIED" as const,
    };
    expect(evaluateConfigSync(envelope)).toEqual({
      state: "NEVER_ACKNOWLEDGED",
      action: "DELIVER_EFFECTIVE_CONFIG",
    });
    expect(evaluateConfigSync(envelope, ack)).toEqual({ state: "CURRENT", action: "NONE" });
    expect(evaluateConfigSync(envelope, { ...ack, config_version: 3 })).toMatchObject({
      state: "STALE_VERSION",
    });
    expect(evaluateConfigSync(envelope, { ...ack, checksum_sha256: "1".repeat(64) })).toMatchObject(
      { state: "CHECKSUM_MISMATCH" }
    );
    expect(evaluateConfigSync(envelope, { ...ack, config_version: 5 })).toMatchObject({
      state: "CONTROLLER_AHEAD_BLOCKED",
    });
    expect(
      evaluateConfigSync(envelope, { ...ack, status: "REJECTED", rejection_code: "UNSUPPORTED" })
    ).toMatchObject({ state: "REJECTED" });
  });
  it("never makes an unacknowledged bundle effective during fallback", () => {
    expect(safeFallback(true)).toBe("KEEP_LAST_ACKNOWLEDGED_AND_MARK_STALE");
    expect(safeFallback(false)).toBe("DISABLE_OFFLINE_NOTIFICATION_AND_SIGNAL_NOT_READY");
  });
});
