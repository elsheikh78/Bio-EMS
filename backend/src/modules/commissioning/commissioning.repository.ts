import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import type {
  CommissioningDeviationSnapshot,
  CommissioningEvidenceKind,
  CommissioningEvidenceState,
} from "./commissioning.domain";

export type CreateCommissioningSession = {
  uuid: string;
  siteId: number;
  controllerIdentity?: string | null;
  platformVersion: string;
  commissioningRevision: string;
  engineerIdentity: string;
  witnessIdentity?: string | null;
  openedAt: string;
};

export type CreateCommissioningCheck = {
  sessionId: number;
  checkKey: string;
  title: string;
  mandatory: boolean;
  physicalOrLiveGate: boolean;
  sensorId?: number | null;
  deviceId?: number | null;
  mapId?: string | null;
};

export type AppendCommissioningEvidence = {
  sessionId: number;
  checkId: number;
  state: CommissioningEvidenceState;
  evidenceKind: CommissioningEvidenceKind;
  executedAt: string;
  actorIdentity: string;
  witnessIdentity?: string | null;
  evidenceReference?: string | null;
  deviationReference?: string | null;
  note?: string | null;
};

export class CommissioningRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  createSession(input: CreateCommissioningSession): number {
    const result = this.database
      .prepare(`
        INSERT INTO commissioning_sessions (
          uuid, site_id, controller_identity, platform_version, commissioning_revision,
          engineer_identity, witness_identity, opened_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.uuid,
        input.siteId,
        input.controllerIdentity ?? null,
        input.platformVersion,
        input.commissioningRevision,
        input.engineerIdentity,
        input.witnessIdentity ?? null,
        input.openedAt
      );
    return Number(result.lastInsertRowid);
  }

  addCheck(input: CreateCommissioningCheck): number {
    const result = this.database
      .prepare(`
        INSERT INTO commissioning_checks (
          session_id, check_key, title, mandatory, physical_or_live_gate,
          sensor_id, device_id, map_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.sessionId,
        input.checkKey,
        input.title,
        input.mandatory ? 1 : 0,
        input.physicalOrLiveGate ? 1 : 0,
        input.sensorId ?? null,
        input.deviceId ?? null,
        input.mapId ?? null
      );
    return Number(result.lastInsertRowid);
  }

  appendEvidence(input: AppendCommissioningEvidence): number {
    const result = this.database
      .prepare(`
        INSERT INTO commissioning_evidence (
          session_id, check_id, state, evidence_kind, executed_at, actor_identity,
          witness_identity, evidence_reference, deviation_reference, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.sessionId,
        input.checkId,
        input.state,
        input.evidenceKind,
        input.executedAt,
        input.actorIdentity,
        input.witnessIdentity ?? null,
        input.evidenceReference ?? null,
        input.deviationReference ?? null,
        input.note ?? null
      );
    return Number(result.lastInsertRowid);
  }

  appendDeviation(
    sessionId: number,
    deviation: CommissioningDeviationSnapshot & {
      description: string;
      recordedAt: string;
      actorIdentity: string;
      evidenceReference?: string | null;
    }
  ): number {
    const result = this.database
      .prepare(`
        INSERT INTO commissioning_deviations (
          session_id, reference, classification, description, recorded_at,
          actor_identity, evidence_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        sessionId,
        deviation.reference,
        deviation.classification,
        deviation.description,
        deviation.recordedAt,
        deviation.actorIdentity,
        deviation.evidenceReference ?? null
      );
    return Number(result.lastInsertRowid);
  }

  appendDecision(input: {
    sessionId: number;
    decision: "ACCEPTED" | "REJECTED";
    decidedAt: string;
    actorIdentity: string;
    witnessIdentity?: string | null;
    note?: string | null;
    snapshot: unknown;
  }): number {
    const result = this.database
      .prepare(`
        INSERT INTO commissioning_decisions (
          session_id, decision, decided_at, actor_identity, witness_identity, note, snapshot_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.sessionId,
        input.decision,
        input.decidedAt,
        input.actorIdentity,
        input.witnessIdentity ?? null,
        input.note ?? null,
        JSON.stringify(input.snapshot)
      );
    return Number(result.lastInsertRowid);
  }

  listDeviations(sessionId: number): CommissioningDeviationSnapshot[] {
    return this.database
      .prepare(`
        SELECT reference, classification
        FROM commissioning_deviations
        WHERE session_id = ?
        ORDER BY id ASC
      `)
      .all(sessionId) as CommissioningDeviationSnapshot[];
  }
}
