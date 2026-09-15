import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { OwnerSupportGrantService } from "../owner-support-grant.service";

describe("owner support grant service", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE platform_principals (
        id TEXT PRIMARY KEY
      );
      CREATE TABLE sites (
        id INTEGER PRIMARY KEY
      );
      CREATE TABLE owner_support_grants (
        id TEXT PRIMARY KEY,
        principal_id TEXT NOT NULL,
        site_id INTEGER,
        reason TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        created_by TEXT NOT NULL,
        FOREIGN KEY(principal_id) REFERENCES platform_principals(id),
        FOREIGN KEY(site_id) REFERENCES sites(id)
      );
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
        site_id INTEGER,
        result TEXT NOT NULL,
        new_values_json TEXT,
        reason TEXT,
        source_context TEXT NOT NULL
      );
      INSERT INTO platform_principals (id) VALUES ('owner');
      INSERT INTO sites (id) VALUES (7), (8);
    `);
  });

  it("issues a site-scoped grant that expires automatically", () => {
    let now = new Date("2026-09-15T10:00:00.000Z");
    const service = new OwnerSupportGrantService(database, () => now);

    const grant = service.issue("owner", 7, "Investigate sensor outage", 30);

    expect(service.isActive("owner", 7)).toBe(true);
    expect(service.isActive("owner", 8)).toBe(false);
    now = new Date("2026-09-15T10:30:00.000Z");
    expect(service.isActive("owner", 7)).toBe(false);
    expect(grant.expiresAt).toBe("2026-09-15T10:30:00.000Z");
  });

  it("revokes a grant immediately and records both audit events", () => {
    const service = new OwnerSupportGrantService(
      database,
      () => new Date("2026-09-15T10:00:00.000Z")
    );
    const grant = service.issue("owner", null, "Approved remote support", 60);

    expect(service.isActive("owner", 8)).toBe(true);
    expect(service.revoke(grant.id, "owner", "Customer ended support")).toBe(true);
    expect(service.isActive("owner", 8)).toBe(false);

    const actions = database
      .prepare("SELECT action FROM audit_events ORDER BY rowid")
      .all() as Array<{ action: string }>;
    expect(actions.map(({ action }) => action)).toEqual([
      "OWNER_SUPPORT_GRANTED",
      "OWNER_SUPPORT_REVOKED",
    ]);
  });

  it.each([0, 481, 1.5])("rejects invalid duration %s", (durationMinutes) => {
    const service = new OwnerSupportGrantService(database);
    expect(() =>
      service.issue("owner", 7, "Investigate sensor outage", durationMinutes)
    ).toThrow("INVALID_SUPPORT_GRANT");
  });
});
