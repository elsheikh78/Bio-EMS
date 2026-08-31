import { createHash } from "node:crypto";
import type { OfflineCriticalConfigBundle } from "../controller-sync/offline-critical-config.contract";
import type { OfflineAlarmEvaluation } from "./offline-alarm-evaluator";

export interface LocalSmsGateway {
  send(request: { recipient: string; message: string; idempotencyKey: string }): Promise<void>;
}

export type LocalSmsResult =
  | { status: "NOT_ELIGIBLE"; reason: string }
  | { status: "SENT"; recipient_uuid: string; idempotency_key: string }
  | { status: "DUPLICATE_SUPPRESSED"; recipient_uuid: string; idempotency_key: string }
  | { status: "FAILED"; recipient_uuid: string; idempotency_key: string };

export class LocalEmergencySmsService {
  private primaryUnavailableSince: string | null = null;
  private readonly sentKeys = new Set<string>();

  constructor(private readonly gateway: LocalSmsGateway) {}

  setPrimaryTransportAvailable(available: boolean, observedAt: string): void {
    assertTimestamp(observedAt);
    if (available) {
      this.primaryUnavailableSince = null;
      return;
    }
    this.primaryUnavailableSince ??= observedAt;
  }

  async process(
    bundle: OfflineCriticalConfigBundle,
    evaluation: OfflineAlarmEvaluation,
    observedAt: string
  ): Promise<LocalSmsResult[]> {
    assertTimestamp(observedAt);
    if (!bundle.sms_failover.enabled)
      return [{ status: "NOT_ELIGIBLE", reason: "FAILOVER_DISABLED" }];
    if (this.primaryUnavailableSince === null)
      return [{ status: "NOT_ELIGIBLE", reason: "PRIMARY_AVAILABLE" }];

    const outageSeconds = (Date.parse(observedAt) - Date.parse(this.primaryUnavailableSince)) / 1_000;
    if (outageSeconds < bundle.sms_failover.primary_unavailable_after_seconds)
      return [{ status: "NOT_ELIGIBLE", reason: "OUTAGE_DELAY_PENDING" }];
    if (evaluation.phase !== "ACTIVE" || !evaluation.condition.startsWith("CRITICAL"))
      return [{ status: "NOT_ELIGIBLE", reason: "CRITICAL_ALARM_NOT_ACTIVE" }];
    if (!evaluation.activated_at)
      return [{ status: "NOT_ELIGIBLE", reason: "CRITICAL_ALARM_NOT_ACTIVE" }];

    const activeSeconds = (Date.parse(observedAt) - Date.parse(evaluation.activated_at)) / 1_000;
    const targets = new Map(bundle.sms_targets.map((target) => [target.recipient_uuid, target]));
    const dueSteps = bundle.critical_escalation_steps.filter(
      (step) => activeSeconds >= step.delay_seconds
    );
    const results: LocalSmsResult[] = [];

    for (const step of dueSteps) {
      const target = targets.get(step.recipient_uuid);
      if (!target) continue;
      const alarmIdentity = `${bundle.site_uuid}:${evaluation.sensor_uuid}:${evaluation.condition}:${evaluation.activated_at}`;
      const idempotencyKey = createHash("sha256")
        .update(`${alarmIdentity}:${step.position}:${step.recipient_uuid}`)
        .digest("hex");
      if (this.sentKeys.has(idempotencyKey)) {
        results.push({
          status: "DUPLICATE_SUPPRESSED",
          recipient_uuid: step.recipient_uuid,
          idempotency_key: idempotencyKey,
        });
        continue;
      }
      const message = `BIO-EMS CRITICAL ${evaluation.condition} Sensor ${evaluation.sensor_uuid} at ${evaluation.sampled_at}`;
      try {
        await this.gateway.send({ recipient: target.sms_address, message, idempotencyKey });
        this.sentKeys.add(idempotencyKey);
        results.push({
          status: "SENT",
          recipient_uuid: step.recipient_uuid,
          idempotency_key: idempotencyKey,
        });
      } catch {
        results.push({
          status: "FAILED",
          recipient_uuid: step.recipient_uuid,
          idempotency_key: idempotencyKey,
        });
      }
    }
    return results.length > 0
      ? results
      : [{ status: "NOT_ELIGIBLE", reason: "ESCALATION_DELAY_PENDING" }];
  }
}

function assertTimestamp(value: string): void {
  if (!Number.isFinite(Date.parse(value)))
    throw new TypeError("Timestamp must be a valid date-time");
}
