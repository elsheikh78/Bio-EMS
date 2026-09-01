export type CommissioningEvidenceState =
  "NOT_RUN" | "PASS" | "FAIL" | "BLOCKED" | "DEFERRED_NON_BLOCKING";

export type CommissioningEvidenceKind =
  "SOFTWARE_AUTOMATED" | "PHYSICAL" | "LIVE_PROVIDER" | "DOCUMENTARY";

export type CommissioningCheckSnapshot = {
  checkId: number;
  mandatory: boolean;
  physicalOrLiveGate: boolean;
  state: CommissioningEvidenceState;
  evidenceKind?: CommissioningEvidenceKind;
  deviationReference?: string | null;
};

export type CommissioningDeviationSnapshot = {
  reference: string;
  classification: "BLOCKING" | "NON_BLOCKING";
};

export type CommissioningAcceptanceEvaluation = {
  acceptable: boolean;
  blockingReasons: string[];
};

export const COMMISSIONING_CHECK_TEMPLATES = [
  ["CONFIGURATION_READINESS", "Configuration and calibration readiness", true, false],
  ["SENSOR_MAPPING", "Physical sensor mapping verification", true, true],
  ["COMMUNICATION", "Trusted telemetry and heartbeat verification", true, true],
  ["ALARM_LIFECYCLE", "Warning, critical and recovery verification", true, true],
  ["ALARM_ACKNOWLEDGEMENT", "Alarm acknowledgement verification", true, true],
  ["NOTIFICATION_PRIMARY", "Primary notification delivery verification", true, true],
  ["SMS_FAILOVER", "Emergency SMS failover verification", true, true],
  ["RECOVERY_REPLAY", "Restart, reconnect and replay verification", true, true],
] as const;

export function evaluateCommissioningAcceptance(
  checks: CommissioningCheckSnapshot[],
  deviations: CommissioningDeviationSnapshot[]
): CommissioningAcceptanceEvaluation {
  const blockingReasons: string[] = [];
  const deviationsByReference = new Map(deviations.map((item) => [item.reference, item]));

  for (const check of checks) {
    if (check.mandatory && ["NOT_RUN", "FAIL", "BLOCKED"].includes(check.state)) {
      blockingReasons.push(`check:${check.checkId}:${check.state}`);
      continue;
    }

    if (check.state === "DEFERRED_NON_BLOCKING") {
      const deviation = check.deviationReference
        ? deviationsByReference.get(check.deviationReference)
        : undefined;
      if (!deviation || deviation.classification !== "NON_BLOCKING" || check.mandatory) {
        blockingReasons.push(`check:${check.checkId}:INVALID_DEFERRED`);
      }
      continue;
    }

    if (
      check.state === "PASS" &&
      check.physicalOrLiveGate &&
      check.evidenceKind !== "PHYSICAL" &&
      check.evidenceKind !== "LIVE_PROVIDER"
    ) {
      blockingReasons.push(`check:${check.checkId}:PHYSICAL_OR_LIVE_EVIDENCE_REQUIRED`);
    }
  }

  for (const deviation of deviations) {
    if (deviation.classification === "BLOCKING") {
      blockingReasons.push(`deviation:${deviation.reference}:BLOCKING`);
    }
  }

  return { acceptable: blockingReasons.length === 0, blockingReasons };
}
