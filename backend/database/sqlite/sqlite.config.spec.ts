import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSqlitePath } from "./sqlite.config";

describe("SQLite deployment path", () => {
  it("preserves the development database location", () => {
    const workingDirectory = path.resolve("srv", "bio-ems", "backend");

    expect(resolveSqlitePath({}, workingDirectory)).toBe(
      path.join(workingDirectory, "database", "bioems.db")
    );
  });

  it("supports a persistent-volume path", () => {
    const workingDirectory = path.resolve("srv", "bio-ems", "backend");
    const persistentPath = path.resolve(
      path.parse(workingDirectory).root,
      "var",
      "lib",
      "bio-ems",
      "configuration.db"
    );

    expect(resolveSqlitePath({ BIOEMS_SQLITE_PATH: persistentPath }, workingDirectory)).toBe(
      persistentPath
    );
  });
});
