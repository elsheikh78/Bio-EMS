import { describe, expect, it } from "vitest";
import { evaluateCommissioningAcceptance } from "./commissioning.domain";

describe("commissioning acceptance evaluator", () => {
  it("accepts completed software checks", () => {
    const result = evaluateCommissioningAcceptance(
      [
        {
          checkId: 1,
          mandatory: true,
          physicalOrLiveGate: false,
          state: "PASS",
          evidenceKind: "SOFTWARE_AUTOMATED",
        },
      ],
      []
    );

    expect(result).toEqual({ acceptable: true, blockingReasons: [] });
  });

  it.each(["NOT_RUN", "FAIL", "BLOCKED"] as const)(
    "blocks mandatory checks in %s state",
    (state) => {
      const result = evaluateCommissioningAcceptance(
        [
          {
            checkId: 2,
            mandatory: true,
            physicalOrLiveGate: false,
            state,
            evidenceKind: "DOCUMENTARY",
          },
        ],
        []
      );

      expect(result.acceptable).toBe(false);
    }
  );

  it("does not allow automated evidence to satisfy a physical or live gate", () => {
    const result = evaluateCommissioningAcceptance(
      [
        {
          checkId: 3,
          mandatory: true,
          physicalOrLiveGate: true,
          state: "PASS",
          evidenceKind: "SOFTWARE_AUTOMATED",
        },
      ],
      []
    );

    expect(result.blockingReasons).toContain("check:3:PHYSICAL_OR_LIVE_EVIDENCE_REQUIRED");
  });

  it("allows physical evidence to satisfy a physical or live gate", () => {
    const result = evaluateCommissioningAcceptance(
      [
        {
          checkId: 4,
          mandatory: true,
          physicalOrLiveGate: true,
          state: "PASS",
          evidenceKind: "PHYSICAL",
        },
      ],
      []
    );

    expect(result.acceptable).toBe(true);
  });

  it("requires an explicit non-blocking deviation for a deferred optional check", () => {
    const valid = evaluateCommissioningAcceptance(
      [
        {
          checkId: 5,
          mandatory: false,
          physicalOrLiveGate: false,
          state: "DEFERRED_NON_BLOCKING",
          evidenceKind: "DOCUMENTARY",
          deviationReference: "DEV-5",
        },
      ],
      [{ reference: "DEV-5", classification: "NON_BLOCKING" }]
    );
    const missing = evaluateCommissioningAcceptance(
      [
        {
          checkId: 5,
          mandatory: false,
          physicalOrLiveGate: false,
          state: "DEFERRED_NON_BLOCKING",
          evidenceKind: "DOCUMENTARY",
        },
      ],
      []
    );

    expect(valid.acceptable).toBe(true);
    expect(missing.acceptable).toBe(false);
  });

  it("never accepts while a blocking deviation exists", () => {
    const result = evaluateCommissioningAcceptance(
      [],
      [{ reference: "DEV-BLOCK", classification: "BLOCKING" }]
    );

    expect(result.acceptable).toBe(false);
  });
});
