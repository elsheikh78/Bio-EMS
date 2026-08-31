import { createHash } from "node:crypto";
import { z } from "zod";

const e164 = z.string().regex(/^\+[1-9]\d{7,14}$/);
const sensorSchema = z
  .object({
    sensor_uuid: z.string().uuid(),
    device_id: z.string().trim().min(1).max(100),
    channel: z.number().int().min(0).max(255),
    enabled: z.literal(true),
    warning_low: z.number().finite().nullable().optional(),
    alarm_low: z.number().finite().nullable(),
    warning_high: z.number().finite().nullable().optional(),
    alarm_high: z.number().finite().nullable(),
    warning_delay_seconds: z.number().int().min(0).max(86_400).optional(),
    critical_delay_seconds: z.number().int().min(0).max(86_400),
  })
  .strict()
  .refine((sensor) => sensor.alarm_low !== null || sensor.alarm_high !== null, {
    message: "At least one critical threshold is required",
  })
  .refine(
    (sensor) =>
      sensor.alarm_low === null ||
      sensor.alarm_high === null ||
      sensor.alarm_low < sensor.alarm_high,
    { message: "Critical low must be less than critical high" }
  )
  .refine(
    (sensor) =>
      sensor.warning_low === undefined ||
      sensor.warning_low === null ||
      sensor.alarm_low === null ||
      sensor.alarm_low < sensor.warning_low,
    { message: "Critical low must be less than warning low" }
  )
  .refine(
    (sensor) =>
      sensor.warning_high === undefined ||
      sensor.warning_high === null ||
      sensor.alarm_high === null ||
      sensor.warning_high < sensor.alarm_high,
    { message: "Warning high must be less than critical high" }
  );
const targetSchema = z.object({ recipient_uuid: z.string().uuid(), sms_address: e164 }).strict();
const stepSchema = z
  .object({
    position: z.number().int().positive(),
    delay_seconds: z.number().int().min(0).max(604_800),
    recipient_uuid: z.string().uuid(),
  })
  .strict();

export const offlineCriticalConfigBundleSchema = z
  .object({
    contract_version: z.literal(1),
    config_version: z.number().int().positive(),
    site_uuid: z.string().uuid(),
    issued_at: z.iso.datetime({ offset: true }),
    sensors: z.array(sensorSchema).min(1).max(1024),
    sms_failover: z
      .object({
        enabled: z.boolean(),
        primary_unavailable_after_seconds: z.number().int().positive().max(86_400),
      })
      .strict(),
    sms_targets: z.array(targetSchema).max(100),
    critical_escalation_steps: z.array(stepSchema).max(20),
  })
  .strict()
  .superRefine((bundle, context) => {
    const sensorKeys = bundle.sensors.map((sensor) => `${sensor.device_id}:${sensor.channel}`);
    if (new Set(sensorKeys).size !== sensorKeys.length)
      context.addIssue({ code: "custom", path: ["sensors"], message: "Duplicate Device channel" });
    const targetIds = bundle.sms_targets.map((target) => target.recipient_uuid);
    if (new Set(targetIds).size !== targetIds.length)
      context.addIssue({ code: "custom", path: ["sms_targets"], message: "Duplicate target" });
    const steps = [...bundle.critical_escalation_steps].sort((a, b) => a.position - b.position);
    if (steps.some((step, index) => step.position !== index + 1))
      context.addIssue({
        code: "custom",
        path: ["critical_escalation_steps"],
        message: "Step positions must be contiguous",
      });
    if (
      steps.some(
        (step, index) => index > 0 && step.delay_seconds <= steps[index - 1]!.delay_seconds
      )
    )
      context.addIssue({
        code: "custom",
        path: ["critical_escalation_steps"],
        message: "Step delays must increase strictly",
      });
    const knownTargets = new Set(targetIds);
    if (steps.some((step) => !knownTargets.has(step.recipient_uuid)))
      context.addIssue({
        code: "custom",
        path: ["critical_escalation_steps"],
        message: "Unknown step target",
      });
    if (bundle.sms_failover.enabled && (bundle.sms_targets.length === 0 || steps.length === 0))
      context.addIssue({
        code: "custom",
        path: ["sms_failover"],
        message: "Enabled failover requires targets and steps",
      });
  });

export type OfflineCriticalConfigBundle = z.infer<typeof offlineCriticalConfigBundleSchema>;
export const configDeliveryEnvelopeSchema = z
  .object({
    bundle: offlineCriticalConfigBundleSchema,
    checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type ConfigDeliveryEnvelope = z.infer<typeof configDeliveryEnvelopeSchema>;

export const configAcknowledgementSchema = z
  .object({
    controller_id: z.string().trim().min(1).max(100),
    site_uuid: z.string().uuid(),
    config_version: z.number().int().positive(),
    checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    acknowledged_at: z.iso.datetime({ offset: true }),
    status: z.enum(["APPLIED", "REJECTED"]),
    rejection_code: z.string().trim().min(1).max(100).optional(),
  })
  .strict()
  .superRefine((ack, context) => {
    if (ack.status === "REJECTED" && !ack.rejection_code)
      context.addIssue({
        code: "custom",
        path: ["rejection_code"],
        message: "Rejection code required",
      });
    if (ack.status === "APPLIED" && ack.rejection_code)
      context.addIssue({
        code: "custom",
        path: ["rejection_code"],
        message: "Applied acknowledgement cannot reject",
      });
  });
export type ConfigAcknowledgement = z.infer<typeof configAcknowledgementSchema>;

export type ConfigSyncState =
  | "CURRENT"
  | "NEVER_ACKNOWLEDGED"
  | "STALE_VERSION"
  | "CHECKSUM_MISMATCH"
  | "REJECTED"
  | "CONTROLLER_AHEAD_BLOCKED"
  | "SITE_MISMATCH";
export interface ConfigSyncDecision {
  state: ConfigSyncState;
  action: "NONE" | "DELIVER_EFFECTIVE_CONFIG" | "BLOCK_AND_INVESTIGATE";
}

export function createConfigDeliveryEnvelope(input: unknown): ConfigDeliveryEnvelope {
  const bundle = offlineCriticalConfigBundleSchema.parse(input);
  return { bundle, checksum_sha256: checksum(bundle) };
}
export function verifyConfigDeliveryEnvelope(input: unknown): ConfigDeliveryEnvelope {
  const envelope = configDeliveryEnvelopeSchema.parse(input);
  if (checksum(envelope.bundle) !== envelope.checksum_sha256)
    throw new TypeError("Configuration checksum mismatch");
  return envelope;
}
export function evaluateConfigSync(
  envelopeInput: unknown,
  acknowledgementInput?: unknown
): ConfigSyncDecision {
  const envelope = verifyConfigDeliveryEnvelope(envelopeInput);
  if (acknowledgementInput === undefined)
    return { state: "NEVER_ACKNOWLEDGED", action: "DELIVER_EFFECTIVE_CONFIG" };
  const ack = configAcknowledgementSchema.parse(acknowledgementInput);
  if (ack.site_uuid !== envelope.bundle.site_uuid)
    return { state: "SITE_MISMATCH", action: "BLOCK_AND_INVESTIGATE" };
  if (ack.status === "REJECTED") return { state: "REJECTED", action: "DELIVER_EFFECTIVE_CONFIG" };
  if (ack.config_version > envelope.bundle.config_version)
    return { state: "CONTROLLER_AHEAD_BLOCKED", action: "BLOCK_AND_INVESTIGATE" };
  if (ack.config_version < envelope.bundle.config_version)
    return { state: "STALE_VERSION", action: "DELIVER_EFFECTIVE_CONFIG" };
  if (ack.checksum_sha256 !== envelope.checksum_sha256)
    return { state: "CHECKSUM_MISMATCH", action: "DELIVER_EFFECTIVE_CONFIG" };
  return { state: "CURRENT", action: "NONE" };
}
export function safeFallback(
  lastAcknowledgedBundleAvailable: boolean
): "KEEP_LAST_ACKNOWLEDGED_AND_MARK_STALE" | "DISABLE_OFFLINE_NOTIFICATION_AND_SIGNAL_NOT_READY" {
  return lastAcknowledgedBundleAvailable
    ? "KEEP_LAST_ACKNOWLEDGED_AND_MARK_STALE"
    : "DISABLE_OFFLINE_NOTIFICATION_AND_SIGNAL_NOT_READY";
}
function checksum(bundle: OfflineCriticalConfigBundle): string {
  return createHash("sha256").update(JSON.stringify(bundle)).digest("hex");
}
