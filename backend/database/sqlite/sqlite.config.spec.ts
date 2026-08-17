import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSqlitePath } from "./sqlite.config";

describe("SQLite deployment path", () => {
  it("preserves the development database location", () => {
    expect(resolveSqlitePath({}, "/srv/bio-ems/backend")).toBe(
      path.join("/srv/bio-ems/backend", "database", "bioems.db")
    );
  });

  it("supports a persistent-volume path", () => {
    expect(
      resolveSqlitePath(
        { BIOEMS_SQLITE_PATH: "/var/lib/bio-ems/configuration.db" },
        "/srv/bio-ems/backend"
      )
    ).toBe("/var/lib/bio-ems/configuration.db");
  });
});
