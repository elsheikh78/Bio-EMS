import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { describeOwnerImportError, loadOwnerImportEnvironment } from "./owner-import-environment";

describe("System Owner import protected environment", () => {
  it("loads the protected backend environment and overrides stale ambient SQLite configuration", () => {
    const directory = mkdtempSync(join(tmpdir(), "bioems-owner-import-env-"));
    const environmentFile = join(directory, "backend.env");
    writeFileSync(
      environmentFile,
      "BIOEMS_SQLITE_PATH=C:\\ProgramData\\BIO-EMS\\data\\bioems.db\nBIOEMS_JWT_ISSUER=bio-ems\n"
    );

    const environment: NodeJS.ProcessEnv = {
      BIOEMS_ENV_FILE: environmentFile,
    };
    const target: NodeJS.ProcessEnv = {
      BIOEMS_SQLITE_PATH: "C:\\stale\\wrong.db",
    };

    loadOwnerImportEnvironment(environment, target);

    expect(environment.BIOEMS_SQLITE_PATH).toBe("C:\\ProgramData\\BIO-EMS\\data\\bioems.db");
    expect(target.BIOEMS_SQLITE_PATH).toBe("C:\\ProgramData\\BIO-EMS\\data\\bioems.db");
    expect(target.BIOEMS_JWT_ISSUER).toBe("bio-ems");
  });

  it("fails closed when the protected environment cannot be loaded", () => {
    const environment: NodeJS.ProcessEnv = {
      BIOEMS_ENV_FILE: join(tmpdir(), "missing-bioems-backend.env"),
    };

    expect(() => loadOwnerImportEnvironment(environment, {})).toThrow(
      "BIO-EMS protected service environment could not be loaded"
    );
  });

  it("requires an explicit SQLite path instead of falling back to a development database", () => {
    expect(() => loadOwnerImportEnvironment({}, {})).toThrow(
      "BIO-EMS SQLite path is unavailable in the protected service environment"
    );
  });

  it("normalizes diagnostic messages without exposing multiline output", () => {
    expect(describeOwnerImportError(new Error("first line\nsecond line"))).toBe(
      "first line second line"
    );
  });
});
