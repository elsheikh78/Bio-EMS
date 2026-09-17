import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { OwnerSecurityAuditService } from "../owner-security-audit.service";

describe("owner security audit service", () => {
  it("stores security evidence without credentials, TOTP codes, or tokens", () => {
    const database = new Database(":memory:");
    database.exec(`
      CREATE TABLE audit_events (
        id TEXT PRIMARY KEY,
        occurred_at TEXT NOT NULL,
        actor_kind TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        actor_username TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        result TEXT NOT NULL,
        new_values_json TEXT,
        session_id TEXT,
        reason TEXT,
        source_context TEXT NOT NULL
      );
    `);
    const audit = new OwnerSecurityAuditService(
      database,
      () => new Date("2026-09-15T10:00:00.000Z")
    );

    audit.record({
      action: "OWNER_MFA_DENIED",
      result: "DENIED",
      principalId: "owner",
      username: "platform-owner",
      reason: "INVALID_OR_MISSING_TOTP",
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    });

    const stored = JSON.stringify(database.prepare("SELECT * FROM audit_events").get());
    expect(stored).toContain("OWNER_MFA_DENIED");
    expect(stored).toContain("127.0.0.1");
    expect(stored).not.toMatch(/password|totp_code|access_token|support_token|enrollment_token/i);
  });
});
