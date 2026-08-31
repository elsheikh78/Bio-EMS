import { describe, expect, it } from "vitest";
import { createConfigDeliveryEnvelope } from "../controller-sync/offline-critical-config.contract";
import { ReconnectReconciliationService } from "./reconnect-reconciliation.service";

const siteUuid = "e70cb67a-0ab0-4e57-ac61-d6142990ca37";
const recipientUuid = "b3d90e36-faf5-4a46-96dc-376dbc1475cb";
const sensorUuid = "8ae946c2-1424-44e8-b98d-ae2fd2f2273e";

const envelope = createConfigDeliveryEnvelope({
  contract_version: 1,
  config_version: 4,
  site_uuid: siteUuid,
  issued_at: "2026-08-31T16:00:00Z",
  sensors: [
    {
      sensor_uuid: sensorUuid,
      device_id: "ZC-FW-001",
      channel: 1,
      enabled: true,
      alarm_low: 2,
      alarm_high: 8,
      critical_delay_seconds: 30,
    },
  ],
  sms_failover: { enabled: true, primary_unavailable_after_seconds: 300 },
  sms_targets: [{ recipient_uuid: recipientUuid, sms_address: "+201001234567" }],
  critical_escalation_steps: [{ position: 1, delay_seconds: 0, recipient_uuid: recipientUuid }],
});

function input() {
  return {
    controller_id: "CTRL-001",
    site_uuid: siteUuid,
    effective_config: {
      site_uuid: siteUuid,
      config_version: envelope.bundle.config_version,
      checksum_sha256: envelope.checksum_sha256,
    },
    server_envelope: envelope,
    buffered_records: [],
    reconciled_at: "2026-08-31T18:00:00Z",
  };
}

describe("reconnect reconciliation", () => {
  it("reports CURRENT when controller and server configuration identities match", () => {
    const result = new ReconnectReconciliationService().reconcile(input());
    expect(result.config_decision).toEqual({ state: "CURRENT", action: "NONE" });
    expect(result.acknowledgement?.status).toBe("APPLIED");
  });

  it("requests redelivery when the controller configuration is stale", () => {
    const result = new ReconnectReconciliationService().reconcile({
      ...input(),
      effective_config: { ...input().effective_config, config_version: 3 },
    });
    expect(result.config_decision).toEqual({
      state: "STALE_VERSION",
      action: "DELIVER_EFFECTIVE_CONFIG",
    });
  });

  it("requests delivery when no controller configuration has ever been acknowledged", () => {
    const result = new ReconnectReconciliationService().reconcile({
      ...input(),
      effective_config: null,
    });
    expect(result.acknowledgement).toBeNull();
    expect(result.config_decision).toEqual({
      state: "NEVER_ACKNOWLEDGED",
      action: "DELIVER_EFFECTIVE_CONFIG",
    });
  });

  it("rejects a same-version checksum conflict", () => {
    const result = new ReconnectReconciliationService().reconcile({
      ...input(),
      effective_config: { ...input().effective_config, checksum_sha256: "a".repeat(64) },
    });
    expect(result.acknowledgement).toMatchObject({
      status: "REJECTED",
      rejection_code: "VERSION_CHECKSUM_CONFLICT",
    });
    expect(result.config_decision).toEqual({
      state: "REJECTED",
      action: "DELIVER_EFFECTIVE_CONFIG",
    });
  });

  it("sorts offline records and marks them as REPLAY", () => {
    const result = new ReconnectReconciliationService().reconcile({
      ...input(),
      buffered_records: [
        {
          sensor_uuid: sensorUuid,
          device_id: "ZC-FW-001",
          channel: 1,
          sampled_at: "2026-08-31T17:02:00Z",
          value_celsius: 6,
          status: "OK",
        },
        {
          sensor_uuid: sensorUuid,
          device_id: "ZC-FW-001",
          channel: 1,
          sampled_at: "2026-08-31T17:01:00Z",
          value_celsius: 5,
          status: "OK",
        },
      ],
    });
    expect(result.replay.map((record) => record.sampled_at)).toEqual([
      "2026-08-31T17:01:00Z",
      "2026-08-31T17:02:00Z",
    ]);
    expect(result.replay.every((record) => record.mode === "REPLAY")).toBe(true);
  });

  it("suppresses replay records only after server acceptance is recorded", () => {
    const service = new ReconnectReconciliationService();
    const withReplay = {
      ...input(),
      buffered_records: [
        {
          sensor_uuid: sensorUuid,
          device_id: "ZC-FW-001",
          channel: 1,
          sampled_at: "2026-08-31T17:01:00Z",
          value_celsius: 5,
          status: "OK" as const,
        },
      ],
    };
    const first = service.reconcile(withReplay);
    expect(first.replay).toHaveLength(1);
    service.markReplayAccepted(first.replay.map((record) => record.replay_id));
    expect(service.reconcile(withReplay).replay).toHaveLength(0);
  });
});
