import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration009 } from "../../database/sqlite/migrations/009_create_platform_principals";
import { migration026 } from "../../database/sqlite/migrations/026_harden_owner_access";
import { hashAccessToken, PlatformSessionService } from "./platform-session.service";

describe("PlatformSessionService", () => {
  let database: Database.Database;
  const now = new Date("2026-09-14T12:00:00.000Z");

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec("PRAGMA foreign_keys = ON; CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    migration009.up(database);
    migration026.up(database);
    database
      .prepare(
        `INSERT INTO platform_principals
          (id, principal_type, username, password_hash, status)
         VALUES ('owner', 'SYSTEM_OWNER', 'system-owner', 'hash', 'active')`
      )
      .run();
  });

  afterEach(() => database.close());

  it("stores only a token hash and validates an active session", () => {
    const service = new PlatformSessionService(database, () => now);
    const session = service.create(
      "owner",
      "secret-access-token",
      new Date("2026-09-14T12:15:00.000Z"),
      { ipAddress: "127.0.0.1", userAgent: "BIO-EMS test" }
    );

    expect(service.isActive(session.id, "owner", "secret-access-token")).toBe(true);
    expect(service.isActive(session.id, "owner", "different-token")).toBe(false);
    expect(
      database.prepare("SELECT token_hash, ip_address, user_agent FROM platform_sessions").get()
    ).toEqual({
      token_hash: hashAccessToken("secret-access-token"),
      ip_address: "127.0.0.1",
      user_agent: "BIO-EMS test",
    });
    expect(JSON.stringify(database.prepare("SELECT * FROM platform_sessions").get())).not.toContain(
      "secret-access-token"
    );
  });

  it("rejects expired sessions and supports immediate revocation", () => {
    const service = new PlatformSessionService(database, () => now);
    const active = service.create("owner", "active-token", new Date("2026-09-14T12:15:00.000Z"));
    const expired = service.create("owner", "expired-token", new Date("2026-09-14T12:00:01.000Z"));

    expect(service.revoke(active.id, "owner")).toBe(true);
    expect(service.isActive(active.id, "owner", "active-token")).toBe(false);

    const later = new PlatformSessionService(database, () => new Date("2026-09-14T12:00:02.000Z"));
    expect(later.isActive(expired.id, "owner", "expired-token")).toBe(false);
  });

  it("expires after 30 minutes of inactivity but slides while activity continues", () => {
    const creator = new PlatformSessionService(database, () => now, 30);
    const idle = creator.create("owner", "idle-token", new Date("2026-09-14T13:00:00.000Z"));
    const active = creator.create("owner", "rolling-token", new Date("2026-09-14T13:00:00.000Z"));

    const afterThirtyMinutes = new PlatformSessionService(
      database,
      () => new Date("2026-09-14T12:30:01.000Z"),
      30
    );
    expect(afterThirtyMinutes.isActive(idle.id, "owner", "idle-token")).toBe(false);

    const atTwentyMinutes = new PlatformSessionService(
      database,
      () => new Date("2026-09-14T12:20:00.000Z"),
      30
    );
    expect(atTwentyMinutes.isActive(active.id, "owner", "rolling-token")).toBe(true);

    const atFortyNineMinutes = new PlatformSessionService(
      database,
      () => new Date("2026-09-14T12:49:00.000Z"),
      30
    );
    expect(atFortyNineMinutes.isActive(active.id, "owner", "rolling-token")).toBe(true);
  });

  it("rotates the persisted token hash during a rolling refresh", () => {
    const creator = new PlatformSessionService(database, () => now, 30);
    const session = creator.create("owner", "old-token", new Date("2026-09-14T13:00:00.000Z"));

    const refresher = new PlatformSessionService(
      database,
      () => new Date("2026-09-14T12:10:00.000Z"),
      30
    );
    expect(
      refresher.refresh(
        session.id,
        "owner",
        "old-token",
        "new-token",
        new Date("2026-09-14T13:10:00.000Z")
      )
    ).toBe(true);

    expect(refresher.isActive(session.id, "owner", "old-token")).toBe(false);
    expect(refresher.isActive(session.id, "owner", "new-token")).toBe(true);
  });

  it("revokes every active owner session without modifying prior revocations", () => {
    const service = new PlatformSessionService(database, () => now);
    const expiresAt = new Date("2026-09-14T12:15:00.000Z");
    const first = service.create("owner", "first-token", expiresAt);
    service.create("owner", "second-token", expiresAt);
    service.revoke(first.id, "owner", "FIRST_REVOKED");

    expect(service.revokeAll("owner")).toBe(1);
    expect(
      database
        .prepare("SELECT COUNT(*) AS count FROM platform_sessions WHERE revoked_at IS NOT NULL")
        .get()
    ).toEqual({ count: 2 });
  });
});
