import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import {
  CreateEscalationPolicyInput,
  UpdateEscalationPolicyInput,
} from "../modules/notification/dto/escalation-policy.schema";

export interface EscalationStep {
  id: number;
  position: number;
  delay_seconds: number;
  recipient_role: string;
  channels: string[];
}
export interface EscalationPolicy {
  id: number;
  uuid: string;
  site_id: number;
  name: string;
  owner_role: string;
  eligible_severities: string[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string | null;
  steps: EscalationStep[];
}
type PolicyRow = Omit<EscalationPolicy, "eligible_severities" | "steps"> & {
  eligible_severities_json: string;
};
type StepRow = Omit<EscalationStep, "channels"> & { channels_json: string };

export class EscalationPolicyRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(input: CreateEscalationPolicyInput): EscalationPolicy {
    const result = this.database
      .prepare(
        `INSERT INTO escalation_policies
        (uuid, site_id, name, owner_role, eligible_severities_json) VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        input.uuid,
        input.site_id,
        input.name,
        input.owner_role,
        canonical(input.eligible_severities)
      );
    this.replaceSteps(Number(result.lastInsertRowid), input.steps);
    return this.findByUuid(input.uuid)!;
  }

  findByUuid(uuid: string): EscalationPolicy | undefined {
    const row = this.database
      .prepare("SELECT * FROM escalation_policies WHERE uuid = ?")
      .get(uuid) as PolicyRow | undefined;
    return row ? this.hydrate(row) : undefined;
  }

  listBySite(siteId: number): EscalationPolicy[] {
    return (
      this.database
        .prepare("SELECT * FROM escalation_policies WHERE site_id = ? ORDER BY id")
        .all(siteId) as PolicyRow[]
    ).map((row) => this.hydrate(row));
  }

  update(uuid: string, input: UpdateEscalationPolicyInput): EscalationPolicy | undefined {
    const current = this.findByUuid(uuid);
    if (!current) return undefined;
    this.database
      .prepare(
        `UPDATE escalation_policies SET name = ?, owner_role = ?,
      eligible_severities_json = ?, updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`
      )
      .run(
        input.name ?? current.name,
        input.owner_role ?? current.owner_role,
        canonical(input.eligible_severities ?? current.eligible_severities),
        uuid
      );
    if (input.steps) this.replaceSteps(current.id, input.steps);
    return this.findByUuid(uuid);
  }

  updateStatus(uuid: string, status: "active" | "inactive"): EscalationPolicy | undefined {
    const result = this.database
      .prepare(
        `UPDATE escalation_policies SET status = ?,
      updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`
      )
      .run(status, uuid);
    return result.changes ? this.findByUuid(uuid) : undefined;
  }

  resolveDue(
    siteId: number,
    severity: "WARNING" | "CRITICAL",
    elapsedSeconds: number
  ): EscalationPolicy[] {
    return (
      this.database
        .prepare(
          `SELECT DISTINCT policies.* FROM escalation_policies policies
      INNER JOIN escalation_policy_steps steps ON steps.policy_id = policies.id
      WHERE policies.site_id = ? AND policies.status = 'active'
        AND EXISTS (SELECT 1 FROM json_each(policies.eligible_severities_json) WHERE value = ?)
        AND steps.delay_seconds <= ? ORDER BY policies.id`
        )
        .all(siteId, severity, elapsedSeconds) as PolicyRow[]
    ).map((row) => ({
      ...this.hydrate(row),
      steps: this.steps(row.id).filter((step) => step.delay_seconds <= elapsedSeconds),
    }));
  }

  private replaceSteps(policyId: number, steps: CreateEscalationPolicyInput["steps"]): void {
    this.database.prepare("DELETE FROM escalation_policy_steps WHERE policy_id = ?").run(policyId);
    const insert = this.database.prepare(`INSERT INTO escalation_policy_steps
      (policy_id, position, delay_seconds, recipient_role, channels_json) VALUES (?, ?, ?, ?, ?)`);
    for (const step of [...steps].sort((a, b) => a.position - b.position))
      insert.run(
        policyId,
        step.position,
        step.delay_seconds,
        step.recipient_role,
        canonical(step.channels)
      );
  }
  private hydrate(row: PolicyRow): EscalationPolicy {
    const { eligible_severities_json, ...policy } = row;
    return {
      ...policy,
      eligible_severities: JSON.parse(eligible_severities_json),
      steps: this.steps(row.id),
    };
  }
  private steps(policyId: number): EscalationStep[] {
    return (
      this.database
        .prepare(
          `SELECT id, position, delay_seconds, recipient_role, channels_json
      FROM escalation_policy_steps WHERE policy_id = ? ORDER BY position`
        )
        .all(policyId) as StepRow[]
    ).map(({ channels_json, ...step }) => ({ ...step, channels: JSON.parse(channels_json) }));
  }
}

function canonical(values: readonly string[]): string {
  return JSON.stringify([...values].sort());
}
