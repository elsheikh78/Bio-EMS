import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";

export type RecoveryPrincipalType = "USER" | "SYSTEM_OWNER";
export type RecoveryOutcome = "SUCCESS" | "DENIED" | "FAILED";

export interface PasswordRecoveryRequest {
  request_id: string;
  principal_type: RecoveryPrincipalType;
  principal_id: number | null;
  username_hint: string | null;
  installation_id: string | null;
  challenge_hash: string | null;
  status: "PENDING" | "APPROVED" | "CONSUMED" | "EXPIRED" | "REVOKED";
  requested_at: string;
  expires_at: string;
  approved_at: string | null;
  consumed_at: string | null;
}

export class PasswordRecoveryRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  createUserRequest(input: {
    principalId: number | null;
    usernameHint: string;
    expiresAt: string;
  }): string {
    const requestId = randomUUID();
    this.database
      .prepare(
        `INSERT INTO password_recovery_requests
         (request_id, principal_type, principal_id, username_hint, expires_at)
         VALUES (?, 'USER', ?, ?, ?)`
      )
      .run(requestId, input.principalId, input.usernameHint, input.expiresAt);
    return requestId;
  }

  listPendingUserRequests(): PasswordRecoveryRequest[] {
    return this.database
      .prepare(
        `SELECT request_id, principal_type, principal_id, username_hint, installation_id,
                challenge_hash, status, requested_at, expires_at, approved_at, consumed_at
         FROM password_recovery_requests
         WHERE principal_type = 'USER' AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP
         ORDER BY requested_at ASC`
      )
      .all() as PasswordRecoveryRequest[];
  }

  findPendingUserRequest(requestId: string): PasswordRecoveryRequest | undefined {
    return this.database
      .prepare(
        `SELECT request_id, principal_type, principal_id, username_hint, installation_id,
                challenge_hash, status, requested_at, expires_at, approved_at, consumed_at
         FROM password_recovery_requests
         WHERE request_id = ? AND principal_type = 'USER' AND status = 'PENDING'
           AND expires_at > CURRENT_TIMESTAMP
         LIMIT 1`
      )
      .get(requestId) as PasswordRecoveryRequest | undefined;
  }

  consume(requestId: string): boolean {
    const result = this.database
      .prepare(
        `UPDATE password_recovery_requests
         SET status = 'CONSUMED', consumed_at = CURRENT_TIMESTAMP
         WHERE request_id = ? AND status IN ('PENDING', 'APPROVED') AND expires_at > CURRENT_TIMESTAMP`
      )
      .run(requestId);
    return result.changes === 1;
  }

  recordAudit(input: {
    eventType: string;
    requestId?: string | null;
    principalType: RecoveryPrincipalType;
    principalId?: number | null;
    actorType: string;
    actorId?: string | null;
    outcome: RecoveryOutcome;
    details?: Record<string, unknown>;
  }): void {
    this.database
      .prepare(
        `INSERT INTO password_recovery_audit
         (event_type, request_id, principal_type, principal_id, actor_type, actor_id, outcome, details_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.eventType,
        input.requestId ?? null,
        input.principalType,
        input.principalId ?? null,
        input.actorType,
        input.actorId ?? null,
        input.outcome,
        input.details ? JSON.stringify(input.details) : null
      );
  }
}
