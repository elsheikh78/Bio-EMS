import type { ControllerRuntimeSnapshot } from "./runtime.contract";

export type ControllerHealthStatus = "HEALTHY" | "DEGRADED" | "NOT_READY";

export interface ControllerHealthEvidence {
  contract_version: 1;
  controller_id: string;
  site_uuid: string;
  observed_at: string;
  status: ControllerHealthStatus;
  runtime_state: ControllerRuntimeSnapshot["state"];
  primary_transport_available: boolean;
  effective_config_version: number | null;
  effective_config_checksum_sha256: string | null;
  watchdog: {
    timeout_ms: number;
    heartbeat_age_ms: number;
    restart_count: number;
    overdue: boolean;
  };
  buffered_replay_count: number;
  pending_local_sms_count: number;
  sensor_fault_count: number;
  reasons: string[];
}

export interface ControllerHealthEvidenceInput {
  snapshot: ControllerRuntimeSnapshot;
  observed_at: string;
  observed_at_ms: number;
  buffered_replay_count: number;
  pending_local_sms_count: number;
  sensor_fault_count: number;
}

export class ControllerHealthEvidenceService {
  collect(input: ControllerHealthEvidenceInput): ControllerHealthEvidence {
    assertTimestamp(input.observed_at);
    assertNonnegativeInteger("buffered_replay_count", input.buffered_replay_count);
    assertNonnegativeInteger("pending_local_sms_count", input.pending_local_sms_count);
    assertNonnegativeInteger("sensor_fault_count", input.sensor_fault_count);
    if (!Number.isFinite(input.observed_at_ms)) {
      throw new TypeError("observed_at_ms must be finite");
    }

    const heartbeatAgeMs = Math.max(
      0,
      input.observed_at_ms - input.snapshot.watchdog.last_heartbeat_at_ms
    );
    const watchdogOverdue = heartbeatAgeMs > input.snapshot.watchdog.timeout_ms;
    const reasons: string[] = [];

    if (!input.snapshot.primary_transport_available) reasons.push("PRIMARY_TRANSPORT_UNAVAILABLE");
    if (watchdogOverdue) reasons.push("WATCHDOG_HEARTBEAT_OVERDUE");
    if (input.snapshot.watchdog.restart_count > 0) reasons.push("RUNTIME_RESTART_OBSERVED");
    if (input.buffered_replay_count > 0) reasons.push("BUFFERED_REPLAY_PENDING");
    if (input.pending_local_sms_count > 0) reasons.push("LOCAL_SMS_PENDING");
    if (input.sensor_fault_count > 0) reasons.push("SENSOR_FAULT_PRESENT");

    const notReady = input.snapshot.state.startsWith("NOT_READY") || input.snapshot.state === "RESTART_REQUIRED";
    if (notReady) reasons.unshift(`RUNTIME_${input.snapshot.state}`);

    return {
      contract_version: 1,
      controller_id: input.snapshot.boundary.controller_id,
      site_uuid: input.snapshot.boundary.site_uuid,
      observed_at: input.observed_at,
      status: notReady ? "NOT_READY" : reasons.length > 0 ? "DEGRADED" : "HEALTHY",
      runtime_state: input.snapshot.state,
      primary_transport_available: input.snapshot.primary_transport_available,
      effective_config_version: input.snapshot.effective_config?.config_version ?? null,
      effective_config_checksum_sha256: input.snapshot.effective_config?.checksum_sha256 ?? null,
      watchdog: {
        timeout_ms: input.snapshot.watchdog.timeout_ms,
        heartbeat_age_ms: heartbeatAgeMs,
        restart_count: input.snapshot.watchdog.restart_count,
        overdue: watchdogOverdue,
      },
      buffered_replay_count: input.buffered_replay_count,
      pending_local_sms_count: input.pending_local_sms_count,
      sensor_fault_count: input.sensor_fault_count,
      reasons,
    };
  }
}

function assertTimestamp(value: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new TypeError("observed_at must be a valid date-time");
}

function assertNonnegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${name} must be a nonnegative integer`);
}
