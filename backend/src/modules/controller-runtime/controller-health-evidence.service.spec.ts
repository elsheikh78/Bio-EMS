import { describe, expect, it } from "vitest";
import { ControllerHealthEvidenceService } from "./controller-health-evidence.service";
import type { ControllerRuntimeSnapshot } from "./runtime.contract";

const checksum = "a".repeat(64);

function snapshot(overrides: Partial<ControllerRuntimeSnapshot> = {}): ControllerRuntimeSnapshot {
  return {
    identity: {
      runtime_name: "bio-ems-site-controller",
      runtime_version: "0.16.3",
      build_id: "test-build",
      hardware_profile: "STANDARD",
    },
    boundary: {
      controller_id: "controller-01",
      site_uuid: "e70cb67a-0ab0-4e57-ac61-d6142990ca37",
      config_contract_version: 1,
    },
    state: "READY_ONLINE",
    primary_transport_available: true,
    effective_config: {
      site_uuid: "e70cb67a-0ab0-4e57-ac61-d6142990ca37",
      config_version: 9,
      checksum_sha256: checksum,
    },
    watchdog: { timeout_ms: 30_000, last_heartbeat_at_ms: 1_000_000, restart_count: 0 },
    ...overrides,
  };
}

const service = new ControllerHealthEvidenceService();
const observedAt = "2026-08-31T18:00:00Z";

function collect(runtimeSnapshot = snapshot(), extras: Partial<Parameters<typeof service.collect>[0]> = {}) {
  return service.collect({
    snapshot: runtimeSnapshot,
    observed_at: observedAt,
    observed_at_ms: 1_010_000,
    buffered_replay_count: 0,
    pending_local_sms_count: 0,
    sensor_fault_count: 0,
    ...extras,
  });
}

describe("ControllerHealthEvidenceService", () => {
  it("reports healthy evidence for a ready online controller", () => {
    const evidence = collect();
    expect(evidence.status).toBe("HEALTHY");
    expect(evidence.reasons).toEqual([]);
    expect(evidence.effective_config_version).toBe(9);
    expect(evidence.watchdog.overdue).toBe(false);
  });

  it("reports degraded evidence while the primary transport is unavailable", () => {
    const evidence = collect(snapshot({ state: "READY_OFFLINE", primary_transport_available: false }));
    expect(evidence.status).toBe("DEGRADED");
    expect(evidence.reasons).toContain("PRIMARY_TRANSPORT_UNAVAILABLE");
  });

  it("reports overdue watchdog and restart evidence", () => {
    const evidence = collect(
      snapshot({ watchdog: { timeout_ms: 30_000, last_heartbeat_at_ms: 900_000, restart_count: 2 } })
    );
    expect(evidence.status).toBe("DEGRADED");
    expect(evidence.watchdog.overdue).toBe(true);
    expect(evidence.reasons).toContain("WATCHDOG_HEARTBEAT_OVERDUE");
    expect(evidence.reasons).toContain("RUNTIME_RESTART_OBSERVED");
  });

  it("surfaces pending replay, local SMS, and sensor fault evidence", () => {
    const evidence = collect(snapshot(), {
      buffered_replay_count: 4,
      pending_local_sms_count: 1,
      sensor_fault_count: 2,
    });
    expect(evidence.status).toBe("DEGRADED");
    expect(evidence.reasons).toEqual([
      "BUFFERED_REPLAY_PENDING",
      "LOCAL_SMS_PENDING",
      "SENSOR_FAULT_PRESENT",
    ]);
  });

  it("reports not-ready runtime states as NOT_READY", () => {
    const evidence = collect(snapshot({ state: "NOT_READY_NO_CONFIG", effective_config: null }));
    expect(evidence.status).toBe("NOT_READY");
    expect(evidence.effective_config_version).toBeNull();
    expect(evidence.reasons[0]).toBe("RUNTIME_NOT_READY_NO_CONFIG");
  });

  it("rejects invalid evidence counters", () => {
    expect(() => collect(snapshot(), { sensor_fault_count: -1 })).toThrow(TypeError);
  });
});
