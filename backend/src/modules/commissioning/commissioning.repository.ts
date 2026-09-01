import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import type {
  CommissioningCheckSnapshot,
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

  assertSessionSite(sessionId: number, siteId: number): void {
    const row = this.database
      .prepare("SELECT id FROM commissioning_sessions WHERE id = ? AND site_id = ?")
      .get(sessionId, siteId);
    if (!row) throw new Error("COMMISSIONING_SESSION_NOT_FOUND");
  }

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
    const check = this.database
      .prepare("SELECT id FROM commissioning_checks WHERE id = ? AND session_id = ?")
      .get(input.checkId, input.sessionId);
    if (!check) throw new Error("COMMISSIONING_CHECK_NOT_FOUND");

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

  listCheckSnapshots(sessionId: number): CommissioningCheckSnapshot[] {
    return this.database
      .prepare(`
        SELECT
          c.id AS checkId,
          c.mandatory AS mandatory,
          c.physical_or_live_gate AS physicalOrLiveGate,
          e.state AS state,
          e.evidence_kind AS evidenceKind,
          e.deviation_reference AS deviationReference
        FROM commissioning_checks c
        LEFT JOIN commissioning_evidence e ON e.id = (
          SELECT latest.id
          FROM commissioning_evidence latest
          WHERE latest.check_id = c.id AND latest.session_id = c.session_id
          ORDER BY latest.id DESC
          LIMIT 1
        )
        WHERE c.session_id = ?
        ORDER BY c.id ASC
      `)
      .all(sessionId)
      .map((row) => {
        const typed = row as {
          checkId: number;
          mandatory: number;
          physicalOrLiveGate: number;
          state: CommissioningEvidenceState | null;
          evidenceKind: CommissioningEvidenceKind | null;
          deviationReference: string | null;
        };
        return {
          checkId: typed.checkId,
          mandatory: typed.mandatory === 1,
          physicalOrLiveGate: typed.physicalOrLiveGate === 1,
          state: typed.state ?? "NOT_RUN",
          evidenceKind: typed.evidenceKind ?? undefined,
          deviationReference: typed.deviationReference ?? undefined,
        };
      });
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
