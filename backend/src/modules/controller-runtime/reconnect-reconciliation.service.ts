import { createHash } from "node:crypto";
import {
  evaluateConfigSync,
  verifyConfigDeliveryEnvelope,
  type ConfigAcknowledgement,
  type ConfigDeliveryEnvelope,
  type ConfigSyncDecision,
} from "../controller-sync/offline-critical-config.contract";
import type { AcknowledgedConfigIdentity } from "./runtime.contract";

export interface BufferedReplayRecord {
  sensor_uuid: string;
  device_id: string;
  channel: number;
  sampled_at: string;
  value_celsius: number | null;
  status: "OK" | "DISCONNECTED" | "INVALID" | "READ_ERROR";
}

export interface ReplayEnvelope extends BufferedReplayRecord {
  mode: "REPLAY";
  replay_id: string;
}

export interface ReconnectReconciliationInput {
  controller_id: string;
  site_uuid: string;
  effective_config: AcknowledgedConfigIdentity | null;
  server_envelope: unknown;
  buffered_records: BufferedReplayRecord[];
  reconciled_at: string;
}

export interface ReconnectReconciliationResult {
  config_decision: ConfigSyncDecision;
  acknowledgement: ConfigAcknowledgement | null;
  replay: ReplayEnvelope[];
}

export class ReconnectReconciliationService {
  private readonly replayedIds = new Set<string>();

  reconcile(input: ReconnectReconciliationInput): ReconnectReconciliationResult {
    assertTimestamp(input.reconciled_at);
    const envelope = verifyConfigDeliveryEnvelope(input.server_envelope);
    const acknowledgement = toAcknowledgement(input, envelope);
    const configDecision = evaluateConfigSync(envelope, acknowledgement ?? undefined);

    return {
      config_decision: configDecision,
      acknowledgement,
      replay: this.buildReplay(input.site_uuid, input.buffered_records),
    };
  }

  markReplayAccepted(replayIds: string[]): void {
    for (const replayId of replayIds) this.replayedIds.add(replayId);
  }

  private buildReplay(siteUuid: string, records: BufferedReplayRecord[]): ReplayEnvelope[] {
    return [...records]
      .sort((left, right) => Date.parse(left.sampled_at) - Date.parse(right.sampled_at))
      .map((record) => ({
        ...record,
        mode: "REPLAY" as const,
        replay_id: replayId(siteUuid, record),
      }))
      .filter((record) => !this.replayedIds.has(record.replay_id));
  }
}

function toAcknowledgement(
  input: ReconnectReconciliationInput,
  envelope: ConfigDeliveryEnvelope
): ConfigAcknowledgement | null {
  const current = input.effective_config;
  if (!current) return null;

  if (current.site_uuid !== input.site_uuid) {
    return {
      controller_id: input.controller_id,
      site_uuid: current.site_uuid,
      config_version: current.config_version,
      checksum_sha256: current.checksum_sha256,
      acknowledged_at: input.reconciled_at,
      status: "REJECTED",
      rejection_code: "SITE_MISMATCH",
    };
  }

  if (
    current.config_version === envelope.bundle.config_version &&
    current.checksum_sha256 !== envelope.checksum_sha256
  ) {
    return {
      controller_id: input.controller_id,
      site_uuid: input.site_uuid,
      config_version: current.config_version,
      checksum_sha256: current.checksum_sha256,
      acknowledged_at: input.reconciled_at,
      status: "REJECTED",
      rejection_code: "VERSION_CHECKSUM_CONFLICT",
    };
  }

  return {
    controller_id: input.controller_id,
    site_uuid: input.site_uuid,
    config_version: current.config_version,
    checksum_sha256: current.checksum_sha256,
    acknowledged_at: input.reconciled_at,
    status: "APPLIED",
  };
}

function replayId(siteUuid: string, record: BufferedReplayRecord): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        site_uuid: siteUuid,
        sensor_uuid: record.sensor_uuid,
        device_id: record.device_id,
        channel: record.channel,
        sampled_at: record.sampled_at,
        value_celsius: record.value_celsius,
        status: record.status,
      })
    )
    .digest("hex");
}

function assertTimestamp(value: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new TypeError("Timestamp must be a valid date-time");
  }
}
