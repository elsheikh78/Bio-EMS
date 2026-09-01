import { evaluateCommissioningAcceptance } from "./commissioning.domain";
import { CommissioningRepository } from "./commissioning.repository";

export class CommissioningService {
  constructor(private readonly repository = new CommissioningRepository()) {}

  appendDecision(input: {
    siteId: number;
    sessionId: number;
    decision: "ACCEPTED" | "REJECTED";
    decidedAt: string;
    actorIdentity: string;
    witnessIdentity?: string | null;
    note?: string | null;
  }): number {
    this.repository.assertSessionSite(input.sessionId, input.siteId);

    const checks = this.repository.listCheckSnapshots(input.sessionId);
    const deviations = this.repository.listDeviations(input.sessionId);
    const evaluation = evaluateCommissioningAcceptance(checks, deviations);

    if (input.decision === "ACCEPTED" && !evaluation.acceptable) {
      throw new Error(`COMMISSIONING_ACCEPTANCE_BLOCKED:${evaluation.blockingReasons.join("|")}`);
    }

    return this.repository.appendDecision({
      sessionId: input.sessionId,
      decision: input.decision,
      decidedAt: input.decidedAt,
      actorIdentity: input.actorIdentity,
      witnessIdentity: input.witnessIdentity,
      note: input.note,
      snapshot: { checks, deviations, evaluation },
    });
  }
}
