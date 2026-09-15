import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export interface PlatformSessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface CreatedPlatformSession {
  id: string;
  expiresAt: string;
}

export class PlatformSessionService {
  constructor(
    private readonly database: Database.Database,
    private readonly now: () => Date = () => new Date()
  ) {}

  create(
    principalId: string,
    accessToken: string,
    expiresAt: Date,
    metadata: PlatformSessionMetadata = {},
    sessionId: string = randomUUID()
  ): CreatedPlatformSession {
    const createdAt = this.now();
    if (expiresAt.getTime() <= createdAt.getTime()) {
      throw new Error("Platform session expiry must be in the future");
    }
    const id = sessionId;
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) throw new Error("Invalid platform session ID");
    this.database
      .prepare(
        `INSERT INTO platform_sessions (
          id, principal_id, token_hash, created_at, expires_at, last_seen_at,
          ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        principalId,
        hashAccessToken(accessToken),
        createdAt.toISOString(),
        expiresAt.toISOString(),
        createdAt.toISOString(),
        metadata.ipAddress?.slice(0, 64) ?? null,
        metadata.userAgent?.slice(0, 512) ?? null
      );
    return { id, expiresAt: expiresAt.toISOString() };
  }

  isActive(id: string, principalId: string, accessToken: string): boolean {
    const now = this.now().toISOString();
    const result = this.database
      .prepare(
        `UPDATE platform_sessions
         SET last_seen_at = ?
         WHERE id = ? AND principal_id = ? AND token_hash = ?
           AND revoked_at IS NULL AND expires_at > ?`
      )
      .run(now, id, principalId, hashAccessToken(accessToken), now);
    return result.changes === 1;
  }

  revoke(id: string, principalId: string, reason = "OWNER_LOGOUT"): boolean {
    const result = this.database
      .prepare(
        `UPDATE platform_sessions
         SET revoked_at = ?, revoked_reason = ?
         WHERE id = ? AND principal_id = ? AND revoked_at IS NULL`
      )
      .run(this.now().toISOString(), reason.slice(0, 128), id, principalId);
    return result.changes === 1;
  }

  revokeAll(principalId: string, reason = "OWNER_REVOKE_ALL"): number {
    const result = this.database
      .prepare(
        `UPDATE platform_sessions
         SET revoked_at = ?, revoked_reason = ?
         WHERE principal_id = ? AND revoked_at IS NULL`
      )
      .run(this.now().toISOString(), reason.slice(0, 128), principalId);
    return result.changes;
  }
}

export function hashAccessToken(accessToken: string): string {
  return createHash("sha256").update(accessToken, "utf8").digest("hex");
}
