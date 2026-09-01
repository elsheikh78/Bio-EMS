import { AppError } from "../../errors/app-error";
import { evaluateCommissioningAcceptance } from "./commissioning.domain";
import {
  AppendCommissioningEvidence,
  CommissioningRepository,
  CreateCommissioningCheck,
  CreateCommissioningSession,
} from "./commissioning.repository";

const siteNotFound = () => new AppError("Site not found", 404, "SITE_NOT_FOUND");
const sessionNotFound = () =>
  new AppError("Commissioning session not found", 404, "COMMISSIONING_SESSION_NOT_FOUND");
const checkNotFound = () =>
  new AppError("Commissioning check not found", 404, "COMMISSIONING_CHECK_NOT_FOUND");
const acceptanceBlocked = () =>
  new AppError("Commissioning acceptance blocked", 409, "COMMISSIONING_ACCEPTANCE_BLOCKED");

export class CommissioningService {
  constructor(private readonly repository = new CommissioningRepository()) {}

  createSession(input: CreateCommissioningSession): number {
    if (!this.repository.siteExists(input.siteId)) throw siteNotFound();
    return this.repository.createSession(input);
  }

  addCheck(siteId: number, input: CreateCommissioningCheck): number {
    this.assertSessionScope(siteId, input.sessionId);
    if (input.deviceId && !this.repository.deviceBelongsToSite(input.deviceId, siteId)) {
      throw new AppError("Commissioning device not found", 404, "COMMISSIONING_DEVICE_NOT_FOUND");
    }
    if (
      input.sensorId &&
      !this.repository.sensorBelongsToSiteAndDevice(input.sensorId, siteId, input.deviceId)
    ) {
      throw new AppError("Commissioning sensor not found", 404, "COMMISSIONING_SENSOR_NOT_FOUND");
    }
    return this.repository.addCheck(input);
  }

  getConfigurationReadiness(siteId: number, asOf: string) {
    if (!this.repository.siteExists(siteId)) throw siteNotFound();
    const items = this.repository.getConfigurationReadiness(siteId, asOf);
    return {
      siteId,
      asOf,
      ready: items.length > 0 && items.every((item) => item.ready),
      summary: {
        totalSensors: items.length,
        readySensors: items.filter((item) => item.ready).length,
        blockedSensors: items.filter((item) => !item.ready).length,
      },
      items,
    };
  }

  appendEvidence(siteId: number, input: AppendCommissioningEvidence): number {
    this.assertSessionScope(siteId, input.sessionId);
    if (!this.repository.checkBelongsToSession(input.checkId, input.sessionId)) {
      throw checkNotFound();
    }
    return this.repository.appendEvidence(input);
  }

  appendDeviation(
    siteId: number,
    sessionId: number,
    input: Parameters<CommissioningRepository["appendDeviation"]>[1]
  ): number {
    this.assertSessionScope(siteId, sessionId);
    return this.repository.appendDeviation(sessionId, input);
  }

  listDeviations(siteId: number, sessionId: number) {
    this.assertSessionScope(siteId, sessionId);
    return this.repository.listDeviations(sessionId);
  }

  appendDecision(input: {
    siteId: number;
    sessionId: number;
    decision: "ACCEPTED" | "REJECTED";
    decidedAt: string;
    actorIdentity: string;
    witnessIdentity?: string | null;
    note?: string | null;
  }): number {
    this.assertSessionScope(input.siteId, input.sessionId);

    const checks = this.repository.listCheckSnapshots(input.sessionId);
    const deviations = this.repository.listDeviations(input.sessionId);
    const evaluation = evaluateCommissioningAcceptance(checks, deviations);

    if (input.decision === "ACCEPTED" && !evaluation.acceptable) {
      throw acceptanceBlocked();
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

  private assertSessionScope(siteId: number, sessionId: number): void {
    if (!this.repository.sessionBelongsToSite(sessionId, siteId)) {
      throw sessionNotFound();
    }
  }
}
