import { describe, expect, it } from "vitest";
import {
  REQUIRED_BENCH_SCENARIOS,
  evaluateBenchQualification,
  type BenchScenarioEvidence,
} from "./bench-qualification.service";

function allPhysicalPass(): BenchScenarioEvidence[] {
  return REQUIRED_BENCH_SCENARIOS.map((scenario) => ({
    scenario,
    status: "PHYSICAL_PASS" as const,
    evidence_ref: `bench://${scenario.toLowerCase()}`,
  }));
}

describe("evaluateBenchQualification", () => {
  it("qualifies only when every mandatory scenario has pass evidence", () => {
    const result = evaluateBenchQualification(allPhysicalPass());
    expect(result.status).toBe("QUALIFIED");
    expect(result.passed).toBe(REQUIRED_BENCH_SCENARIOS.length);
    expect(result.blocked).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(result.external_not_run).toEqual([]);
  });

  it("does not qualify when a physical scenario has not been run", () => {
    const evidence = allPhysicalPass();
    evidence[1] = {
      scenario: "POWER_LOSS_RESTART",
      status: "EXTERNAL_NOT_RUN",
      evidence_ref: "external://bench/power-loss",
    };
    const result = evaluateBenchQualification(evidence);
    expect(result.status).toBe("NOT_QUALIFIED");
    expect(result.external_not_run).toEqual(["POWER_LOSS_RESTART"]);
  });

  it("does not qualify a blocked software boundary", () => {
    const evidence = allPhysicalPass();
    evidence[1] = {
      scenario: "POWER_LOSS_RESTART",
      status: "BLOCKED",
      evidence_ref: "repo://p2-03/full-bundle-persistence-gap",
    };
    const result = evaluateBenchQualification(evidence);
    expect(result.status).toBe("NOT_QUALIFIED");
    expect(result.blocked).toEqual(["POWER_LOSS_RESTART"]);
  });

  it("treats missing mandatory evidence as not run", () => {
    const result = evaluateBenchQualification([]);
    expect(result.status).toBe("NOT_QUALIFIED");
    expect(result.external_not_run).toEqual(REQUIRED_BENCH_SCENARIOS);
  });

  it("rejects duplicate scenario evidence", () => {
    const entry: BenchScenarioEvidence = {
      scenario: "CLEAN_BOOT",
      status: "AUTOMATED_PASS",
      evidence_ref: "ci://runtime-boot",
    };
    expect(() => evaluateBenchQualification([entry, entry])).toThrow(TypeError);
  });

  it("rejects blank evidence references", () => {
    expect(() =>
      evaluateBenchQualification([
        { scenario: "CLEAN_BOOT", status: "AUTOMATED_PASS", evidence_ref: "   " },
      ])
    ).toThrow(TypeError);
  });
});
