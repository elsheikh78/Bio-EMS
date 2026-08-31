import { describe, expect, it } from "vitest";
import type { OfflineCriticalConfigBundle } from "../controller-sync/offline-critical-config.contract";
import { LocalEmergencySmsService, type LocalSmsGateway } from "./local-emergency-sms.service";
import type { OfflineAlarmEvaluation } from "./offline-alarm-evaluator";

const recipientUuid = "b3d90e36-faf5-4a46-96dc-376dbc1475cb";
const bundle: OfflineCriticalConfigBundle = {
  contract_version: 1,
  config_version: 9,
  site_uuid: "e70cb67a-0ab0-4e57-ac61-d6142990ca37",
  issued_at: "2026-08-31T17:00:00Z",
  sensors: [
    {
      sensor_uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
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
};

const alarm: OfflineAlarmEvaluation = {
  sensor_uuid: bundle.sensors[0].sensor_uuid,
  device_id: "ZC-FW-001",
  channel: 1,
  sampled_at: "2026-08-31T17:06:00Z",
  value_celsius: 9,
  condition: "CRITICAL_HIGH",
  phase: "ACTIVE",
  first_observed_at: "2026-08-31T17:05:30Z",
  activated_at: "2026-08-31T17:06:00Z",
};

function harness() {
  const sent: Array<{ recipient: string; message: string; idempotencyKey: string }> = [];
  const gateway: LocalSmsGateway = {
    send: async (request) => {
      sent.push(request);
    },
  };
  return { service: new LocalEmergencySmsService(gateway), sent };
}

describe("local emergency SMS failover", () => {
  it("does not send while primary transport is healthy", async () => {
    const { service, sent } = harness();
    const result = await service.process(bundle, alarm, "2026-08-31T17:06:00Z");
    expect(result).toEqual([{ status: "NOT_ELIGIBLE", reason: "PRIMARY_AVAILABLE" }]);
    expect(sent).toHaveLength(0);
  });

  it("waits for the configured primary outage threshold", async () => {
    const { service, sent } = harness();
    service.setPrimaryTransportAvailable(false, "2026-08-31T17:00:00Z");
    const result = await service.process(bundle, alarm, "2026-08-31T17:04:59Z");
    expect(result).toEqual([{ status: "NOT_ELIGIBLE", reason: "OUTAGE_DELAY_PENDING" }]);
    expect(sent).toHaveLength(0);
  });

  it("sends an active critical alarm after the outage threshold", async () => {
    const { service, sent } = harness();
    service.setPrimaryTransportAvailable(false, "2026-08-31T17:00:00Z");
    const result = await service.process(bundle, alarm, "2026-08-31T17:06:00Z");
    expect(result[0]?.status).toBe("SENT");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.recipient).toBe("+201001234567");
  });

  it("suppresses duplicate local sends for the same alarm and escalation step", async () => {
    const { service, sent } = harness();
    service.setPrimaryTransportAvailable(false, "2026-08-31T17:00:00Z");
    await service.process(bundle, alarm, "2026-08-31T17:06:00Z");
    const second = await service.process(bundle, alarm, "2026-08-31T17:07:00Z");
    expect(second[0]?.status).toBe("DUPLICATE_SUPPRESSED");
    expect(sent).toHaveLength(1);
  });

  it("does not send warning, pending, or fault evaluations", async () => {
    const { service, sent } = harness();
    service.setPrimaryTransportAvailable(false, "2026-08-31T17:00:00Z");
    for (const evaluation of [
      { ...alarm, condition: "WARNING_HIGH" as const },
      { ...alarm, phase: "PENDING" as const },
      { ...alarm, condition: "SENSOR_FAULT" as const, phase: "FAULT" as const },
    ]) {
      const result = await service.process(bundle, evaluation, "2026-08-31T17:06:00Z");
      expect(result[0]?.status).toBe("NOT_ELIGIBLE");
    }
    expect(sent).toHaveLength(0);
  });

  it("re-enables server-owned delivery immediately when primary transport recovers", async () => {
    const { service, sent } = harness();
    service.setPrimaryTransportAvailable(false, "2026-08-31T17:00:00Z");
    service.setPrimaryTransportAvailable(true, "2026-08-31T17:05:30Z");
    const result = await service.process(bundle, alarm, "2026-08-31T17:06:00Z");
    expect(result).toEqual([{ status: "NOT_ELIGIBLE", reason: "PRIMARY_AVAILABLE" }]);
    expect(sent).toHaveLength(0);
  });
});
