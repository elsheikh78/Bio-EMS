import { describe, expect, it } from "vitest";
import type {
  OfflineCriticalConfigBundle,
} from "../controller-sync/offline-critical-config.contract";
import type { SensorAcquisitionCycle } from "./sensor-acquisition.service";
import { OfflineAlarmEvaluator } from "./offline-alarm-evaluator";

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
      warning_low: 3,
      alarm_low: 2,
      warning_high: 7,
      alarm_high: 8,
      warning_delay_seconds: 10,
      critical_delay_seconds: 30,
    },
  ],
  sms_failover: {
    enabled: false,
    primary_unavailable_after_seconds: 300,
  },
  sms_targets: [],
  critical_escalation_steps: [],
};

function cycle(
  sampledAt: string,
  value: number | null,
  status: "OK" | "DISCONNECTED" | "INVALID" | "READ_ERROR" = "OK"
): SensorAcquisitionCycle {
  return {
    sampled_at: sampledAt,
    samples: [
      {
        sensor_uuid: bundle.sensors[0].sensor_uuid,
        device_id: "ZC-FW-001",
        channel: 1,
        sampled_at: sampledAt,
        status,
        value_celsius: value,
      },
    ],
  };
}

function evaluateAt(evaluator: OfflineAlarmEvaluator, sampledAt: string, value: number) {
  return evaluator.evaluate(bundle, cycle(sampledAt, value))[0];
}

describe("offline alarm evaluator", () => {
  it("keeps normal readings normal without pending state", () => {
    const evaluator = new OfflineAlarmEvaluator();
    const result = evaluateAt(evaluator, "2026-08-31T17:00:01Z", 5);

    expect(result).toMatchObject({
      condition: "NORMAL",
      phase: "NORMAL",
      first_observed_at: null,
      activated_at: null,
    });
  });

  it("applies warning activation delay from the first continuous observation", () => {
    const evaluator = new OfflineAlarmEvaluator();
    const first = evaluateAt(evaluator, "2026-08-31T17:00:00Z", 2.5);
    const beforeDelay = evaluateAt(evaluator, "2026-08-31T17:00:09Z", 2.6);
    const active = evaluateAt(evaluator, "2026-08-31T17:00:10Z", 2.7);

    expect(first.phase).toBe("PENDING");
    expect(beforeDelay.phase).toBe("PENDING");
    expect(active).toMatchObject({
      condition: "WARNING_LOW",
      phase: "ACTIVE",
      first_observed_at: "2026-08-31T17:00:00Z",
      activated_at: "2026-08-31T17:00:10Z",
    });
  });

  it("restarts delay when severity or direction changes", () => {
    const evaluator = new OfflineAlarmEvaluator();
    evaluateAt(evaluator, "2026-08-31T17:00:00Z", 7.5);
    const critical = evaluateAt(evaluator, "2026-08-31T17:00:05Z", 8.5);

    expect(critical).toMatchObject({
      condition: "CRITICAL_HIGH",
      phase: "PENDING",
      first_observed_at: "2026-08-31T17:00:05Z",
    });
  });

  it("clears pending or active state when the reading recovers", () => {
    const evaluator = new OfflineAlarmEvaluator();
    evaluateAt(evaluator, "2026-08-31T17:00:00Z", 1.5);
    evaluateAt(evaluator, "2026-08-31T17:00:30Z", 1.5);
    const normal = evaluateAt(evaluator, "2026-08-31T17:00:31Z", 5);
    const newPending = evaluateAt(evaluator, "2026-08-31T17:00:32Z", 1.5);

    expect(normal.phase).toBe("NORMAL");
    expect(newPending).toMatchObject({
      condition: "CRITICAL_LOW",
      phase: "PENDING",
      first_observed_at: "2026-08-31T17:00:32Z",
    });
  });

  it("maps acquisition failures to sensor fault and resets alarm timing", () => {
    const evaluator = new OfflineAlarmEvaluator();
    evaluateAt(evaluator, "2026-08-31T17:00:00Z", 1.5);
    const fault = evaluator.evaluate(
      bundle,
      cycle("2026-08-31T17:00:10Z", null, "DISCONNECTED")
    )[0];
    const pendingAgain = evaluateAt(evaluator, "2026-08-31T17:00:11Z", 1.5);

    expect(fault).toMatchObject({
      condition: "SENSOR_FAULT",
      phase: "FAULT",
      value_celsius: null,
    });
    expect(pendingAgain.first_observed_at).toBe("2026-08-31T17:00:11Z");
  });

  it("rejects identity mismatch and non-monotonic time", () => {
    const evaluator = new OfflineAlarmEvaluator();
    evaluateAt(evaluator, "2026-08-31T17:00:10Z", 1.5);

    expect(() => evaluateAt(evaluator, "2026-08-31T17:00:09Z", 1.5)).toThrow(
      /Non-monotonic/
    );

    const wrongIdentity = cycle("2026-08-31T17:00:11Z", 5);
    wrongIdentity.samples[0].channel = 2;
    expect(() => evaluator.evaluate(bundle, wrongIdentity)).toThrow(/identity mismatch/);
  });
});
