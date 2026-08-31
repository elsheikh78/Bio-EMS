import { describe, expect, it } from "vitest";
import { createConfigDeliveryEnvelope } from "../controller-sync/offline-critical-config.contract";
import { SiteControllerRuntime } from "./site-controller.runtime";

const SITE_UUID = "e70cb67a-0ab0-4e57-ac61-d6142990ca37";
const OTHER_SITE_UUID = "c2d4f7da-64f0-4d03-b45d-3735a8d3a2aa";
const RECIPIENT_UUID = "b3d90e36-faf5-4a46-96dc-376dbc1475cb";
const ACK_TIME = "2026-08-31T15:30:00Z";

function bundle(configVersion: number, siteUuid = SITE_UUID) {
  return {
    contract_version: 1 as const,
    config_version: configVersion,
    site_uuid: siteUuid,
    issued_at: "2026-08-31T15:29:00Z",
    sensors: [
      {
        sensor_uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
        device_id: "BIO-CTRL-001",
        channel: 1,
        enabled: true as const,
        alarm_low: 2,
        alarm_high: 8,
        critical_delay_seconds: 30,
      },
    ],
    sms_failover: { enabled: true, primary_unavailable_after_seconds: 300 },
    sms_targets: [{ recipient_uuid: RECIPIENT_UUID, sms_address: "+201001234567" }],
    critical_escalation_steps: [
      { position: 1, delay_seconds: 0, recipient_uuid: RECIPIENT_UUID },
    ],
  };
}

function runtimeWithConfig(configVersion = 4) {
  const initialEnvelope = createConfigDeliveryEnvelope(bundle(configVersion));
  return SiteControllerRuntime.boot(
    {
      identity: {
        runtime_name: "bio-ems-site-controller",
        runtime_version: "0.1.0",
        build_id: "p2-02-test-build",
        hardware_profile: "STANDARD",
      },
      boundary: {
        controller_id: "controller-001",
        site_uuid: SITE_UUID,
        config_contract_version: 1,
      },
      persisted_config: {
        site_uuid: SITE_UUID,
        config_version: configVersion,
        checksum_sha256: initialEnvelope.checksum_sha256,
      },
      primary_transport_available: true,
    },
    1_000
  );
}

describe("controller configuration receipt", () => {
  it("applies a newer verified envelope and returns an APPLIED acknowledgement", () => {
    const runtime = runtimeWithConfig(4);
    const envelope = createConfigDeliveryEnvelope(bundle(5));

    const result = runtime.receiveConfigEnvelope(envelope, ACK_TIME);

    expect(result.acknowledgement).toMatchObject({
      controller_id: "controller-001",
      site_uuid: SITE_UUID,
      config_version: 5,
      checksum_sha256: envelope.checksum_sha256,
      status: "APPLIED",
    });
    expect(runtime.snapshot().effective_config).toEqual(result.accepted_config);
  });

  it("accepts an exact duplicate idempotently", () => {
    const envelope = createConfigDeliveryEnvelope(bundle(4));
    const runtime = runtimeWithConfig(4);

    const result = runtime.receiveConfigEnvelope(envelope, ACK_TIME);

    expect(result.acknowledgement.status).toBe("APPLIED");
    expect(runtime.snapshot().effective_config?.config_version).toBe(4);
  });

  it("rejects a tampered envelope and preserves the known-good effective config", () => {
    const runtime = runtimeWithConfig(4);
    const envelope = createConfigDeliveryEnvelope(bundle(5));
    const before = runtime.snapshot().effective_config;

    const result = runtime.receiveConfigEnvelope(
      { ...envelope, checksum_sha256: "0".repeat(64) },
      ACK_TIME
    );

    expect(result.acknowledgement).toMatchObject({
      status: "REJECTED",
      rejection_code: "INVALID_ENVELOPE",
    });
    expect(runtime.snapshot().effective_config).toEqual(before);
  });

  it("rejects an envelope for another Site and preserves the known-good config", () => {
    const runtime = runtimeWithConfig(4);
    const before = runtime.snapshot().effective_config;
    const envelope = createConfigDeliveryEnvelope(bundle(5, OTHER_SITE_UUID));

    const result = runtime.receiveConfigEnvelope(envelope, ACK_TIME);

    expect(result.acknowledgement).toMatchObject({
      status: "REJECTED",
      rejection_code: "SITE_MISMATCH",
    });
    expect(runtime.snapshot().effective_config).toEqual(before);
  });

  it("rejects a stale lower version without replacing the known-good config", () => {
    const runtime = runtimeWithConfig(4);
    const before = runtime.snapshot().effective_config;
    const envelope = createConfigDeliveryEnvelope(bundle(3));

    const result = runtime.receiveConfigEnvelope(envelope, ACK_TIME);

    expect(result.acknowledgement).toMatchObject({
      status: "REJECTED",
      rejection_code: "STALE_CONFIG_VERSION",
    });
    expect(runtime.snapshot().effective_config).toEqual(before);
  });

  it("rejects a same-version checksum conflict", () => {
    const runtime = runtimeWithConfig(4);
    const before = runtime.snapshot().effective_config;
    const conflicting = createConfigDeliveryEnvelope({
      ...bundle(4),
      issued_at: "2026-08-31T15:29:30Z",
    });

    const result = runtime.receiveConfigEnvelope(conflicting, ACK_TIME);

    expect(result.acknowledgement).toMatchObject({
      status: "REJECTED",
      rejection_code: "VERSION_CHECKSUM_CONFLICT",
    });
    expect(runtime.snapshot().effective_config).toEqual(before);
  });
});
