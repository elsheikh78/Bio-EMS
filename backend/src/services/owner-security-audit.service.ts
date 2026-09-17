import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export type OwnerSecurityAuditResult = "SUCCESS" | "DENIED" | "FAILED";

export interface OwnerSecurityAuditInput {
  action: string;
  result: OwnerSecurityAuditResult;
  principalId?: string;
  username?: string;
  targetType?: string;
  targetId?: string;
  sessionId?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class OwnerSecurityAuditService {
  constructor(
    private readonly database: Database.Database,
    private readonly now: () => Date = () => new Date()
  ) {}

  record(input: OwnerSecurityAuditInput): void {
    const metadata =
      input.ipAddress || input.userAgent
        ? JSON.stringify({
            ...(input.ipAddress ? { ip_address: input.ipAddress } : {}),
            ...(input.userAgent ? { user_agent: input.userAgent } : {}),
          })
        : null;

    this.database
      .prepare(
        `INSERT INTO audit_events (
          id, occurred_at, actor_kind, actor_id, actor_username, actor_role,
          action, target_type, target_id, result, new_values_json, session_id,
          reason, source_context
        ) VALUES (?, ?, 'PLATFORM', ?, ?, 'SYSTEM_OWNER', ?, ?, ?, ?, ?, ?, ?, 'OWNER_SECURITY')`
      )
      .run(
        randomUUID(),
        this.now().toISOString(),
        input.principalId ?? "unknown-owner",
        input.username ?? "unknown-owner",
        input.action,
        input.targetType ?? null,
        input.targetId ?? null,
        input.result,
        metadata,
        input.sessionId ?? null,
        input.reason ?? null
      );
  }
}
