import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

const MAX_SUPPORT_GRANT_MINUTES = 8 * 60;

export interface OwnerSupportGrant {
  id: string;
  principalId: string;
  siteId: number | null;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export class OwnerSupportGrantService {
  constructor(
    private readonly database: Database.Database,
    private readonly now: () => Date = () => new Date()
  ) {}

  issue(
    principalId: string,
    siteId: number | null,
    reason: string,
    durationMinutes: number
  ): OwnerSupportGrant {
    const normalizedReason = reason.trim();
    if (
      normalizedReason.length < 8 ||
      normalizedReason.length > 500 ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > MAX_SUPPORT_GRANT_MINUTES
    ) {
      throw new Error("INVALID_SUPPORT_GRANT");
    }

    const issuedAt = this.now();
    const expiresAt = new Date(issuedAt.getTime() + durationMinutes * 60_000);
    const id = randomUUID();

    this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO owner_support_grants
            (id, principal_id, site_id, reason, issued_at, expires_at, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          principalId,
          siteId,
          normalizedReason,
          issuedAt.toISOString(),
          expiresAt.toISOString(),
          principalId
        );
      this.audit("OWNER_SUPPORT_GRANTED", id, principalId, siteId, normalizedReason, issuedAt, {
        expires_at: expiresAt.toISOString(),
      });
    })();

    return {
      id,
      principalId,
      siteId,
      reason: normalizedReason,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: null,
    };
  }

  revoke(id: string, principalId: string, reason: string): boolean {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 8 || normalizedReason.length > 500) {
      throw new Error("INVALID_SUPPORT_REVOCATION");
    }

    const revokedAt = this.now();
    return this.database.transaction(() => {
      const existing = this.database
        .prepare(
          `SELECT site_id AS siteId
           FROM owner_support_grants
           WHERE id = ? AND principal_id = ? AND revoked_at IS NULL`
        )
        .get(id, principalId) as { siteId: number | null } | undefined;
      if (!existing) return false;

      const result = this.database
        .prepare(
          `UPDATE owner_support_grants
           SET revoked_at = ?
           WHERE id = ? AND principal_id = ? AND revoked_at IS NULL`
        )
        .run(revokedAt.toISOString(), id, principalId);
      if (result.changes !== 1) return false;

      this.audit(
        "OWNER_SUPPORT_REVOKED",
        id,
        principalId,
        existing.siteId,
        normalizedReason,
        revokedAt
      );
      return true;
    })();
  }

  isActive(principalId: string, siteId: number | null): boolean {
    const checkedAt = this.now().toISOString();
    const row = this.database
      .prepare(
        `SELECT 1
         FROM owner_support_grants
         WHERE principal_id = ?
           AND revoked_at IS NULL
           AND issued_at <= ?
           AND expires_at > ?
           AND (site_id IS NULL OR site_id = ?)
         LIMIT 1`
      )
      .get(principalId, checkedAt, checkedAt, siteId);
    return Boolean(row);
  }

  private audit(
    action: string,
    grantId: string,
    principalId: string,
    siteId: number | null,
    reason: string,
    occurredAt: Date,
    newValues?: Record<string, unknown>
  ): void {
    this.database
      .prepare(
        `INSERT INTO audit_events (
          id, occurred_at, actor_kind, actor_id, actor_username, actor_role,
          action, target_type, target_id, site_id, result, new_values_json,
          reason, source_context
        ) VALUES (?, ?, 'PLATFORM', ?, ?, 'SYSTEM_OWNER', ?,
          'OWNER_SUPPORT_GRANT', ?, ?, 'SUCCESS', ?, ?, 'OWNER_SUPPORT')`
      )
      .run(
        randomUUID(),
        occurredAt.toISOString(),
        principalId,
        principalId,
        action,
        grantId,
        siteId,
        newValues ? JSON.stringify(newValues) : null,
        reason
      );
  }
}
