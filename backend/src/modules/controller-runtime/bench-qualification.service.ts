export type BenchScenarioId =
  | "CLEAN_BOOT"
  | "POWER_LOSS_RESTART"
  | "NETWORK_LOSS"
  | "NETWORK_RECOVERY"
  | "STALE_CONFIGURATION"
  | "CORRUPTED_CONFIGURATION"
  | "SENSOR_DISCONNECT"
  | "THRESHOLD_EXCURSION"
  | "PERSISTENCE_DELAY"
  | "ALARM_RECOVERY"
  | "SMS_FAILOVER_TRIGGER"
  | "RECONNECT_RECONCILIATION";

export type BenchEvidenceStatus =
  | "AUTOMATED_PASS"
  | "PHYSICAL_PASS"
  | "EXTERNAL_NOT_RUN"
  | "BLOCKED"
  | "FAIL";

export interface BenchScenarioEvidence {
  scenario: BenchScenarioId;
  status: BenchEvidenceStatus;
  evidence_ref: string;
  note?: string;
}

export interface BenchQualificationResult {
  status: "QUALIFIED" | "NOT_QUALIFIED";
  total: number;
  passed: number;
  blocked: BenchScenarioId[];
  failed: BenchScenarioId[];
  external_not_run: BenchScenarioId[];
}

export const REQUIRED_BENCH_SCENARIOS: readonly BenchScenarioId[] = [
  "CLEAN_BOOT",
  "POWER_LOSS_RESTART",
  "NETWORK_LOSS",
  "NETWORK_RECOVERY",
  "STALE_CONFIGURATION",
  "CORRUPTED_CONFIGURATION",
  "SENSOR_DISCONNECT",
  "THRESHOLD_EXCURSION",
  "PERSISTENCE_DELAY",
  "ALARM_RECOVERY",
  "SMS_FAILOVER_TRIGGER",
  "RECONNECT_RECONCILIATION",
];

export function evaluateBenchQualification(
  evidence: readonly BenchScenarioEvidence[]
): BenchQualificationResult {
  const byScenario = new Map<BenchScenarioId, BenchScenarioEvidence>();
  for (const entry of evidence) {
    if (byScenario.has(entry.scenario)) {
      throw new TypeError(`Duplicate bench evidence for ${entry.scenario}`);
    }
    if (!entry.evidence_ref.trim()) {
      throw new TypeError(`Evidence reference required for ${entry.scenario}`);
    }
    byScenario.set(entry.scenario, entry);
  }

  const blocked: BenchScenarioId[] = [];
  const failed: BenchScenarioId[] = [];
  const externalNotRun: BenchScenarioId[] = [];
  let passed = 0;

  for (const scenario of REQUIRED_BENCH_SCENARIOS) {
    const entry = byScenario.get(scenario);
    if (!entry) {
      externalNotRun.push(scenario);
      continue;
    }
    switch (entry.status) {
      case "AUTOMATED_PASS":
      case "PHYSICAL_PASS":
        passed += 1;
        break;
      case "BLOCKED":
        blocked.push(scenario);
        break;
      case "FAIL":
        failed.push(scenario);
        break;
      case "EXTERNAL_NOT_RUN":
        externalNotRun.push(scenario);
        break;
    }
  }

  const allScenariosPassed =
    passed === REQUIRED_BENCH_SCENARIOS.length &&
    blocked.length === 0 &&
    failed.length === 0 &&
    externalNotRun.length === 0;

  return {
    status: allScenariosPassed ? "QUALIFIED" : "NOT_QUALIFIED",
    total: REQUIRED_BENCH_SCENARIOS.length,
    passed,
    blocked,
    failed,
    external_not_run: externalNotRun,
  };
}
