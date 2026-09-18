import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasPermission } from "../../authorization/authorization.policy";
import { PERMISSION } from "../../authorization/permissions";
import { resolveAllowedBackupDestination } from "./platform-backup.service";

describe("DEP-BR platform backup authorization", () => {
  it("allows ADMIN and denies OPERATOR and VIEWER", () => {
    expect(hasPermission("ADMIN", PERMISSION.PLATFORM_BACKUP_READ)).toBe(true);
    expect(hasPermission("ADMIN", PERMISSION.PLATFORM_BACKUP_MANAGE)).toBe(true);
    expect(hasPermission("OPERATOR", PERMISSION.PLATFORM_BACKUP_READ)).toBe(false);
    expect(hasPermission("OPERATOR", PERMISSION.PLATFORM_BACKUP_MANAGE)).toBe(false);
    expect(hasPermission("VIEWER", PERMISSION.PLATFORM_BACKUP_READ)).toBe(false);
    expect(hasPermission("VIEWER", PERMISSION.PLATFORM_BACKUP_MANAGE)).toBe(false);
  });
});

describe("DEP-BR backup destination boundary", () => {
  const environment = {
    BIOEMS_SQLITE_BACKUP_DIR: "/var/lib/bioems/backups",
  } as NodeJS.ProcessEnv;

  it("uses the configured backup root by default", () => {
    expect(resolveAllowedBackupDestination(undefined, environment)).toMatch(
      /\/var\/lib\/bioems\/backups$/
    );
  });

  it("rejects a destination outside the configured backup root", () => {
    expect(() => resolveAllowedBackupDestination("/tmp/stolen-backup", environment)).toThrow(
      "outside the configured allowed root"
    );
  });

  it("requires an absolute configured backup root", () => {
    expect(() =>
      resolveAllowedBackupDestination(undefined, {
        BIOEMS_SQLITE_BACKUP_DIR: "relative/backups",
      })
    ).toThrow("must be absolute");
  });
});

describe("DEP-BR sealed backup contract", () => {
  it("keeps telemetry pending until the external InfluxDB snapshot is sealed", async () => {
    const source = await readFile(
      join(process.cwd(), "src/modules/platform-backup/platform-backup.service.ts"),
      "utf8"
    );
    expect(source).toContain("PENDING_EXTERNAL_SNAPSHOT");
    expect(source).toContain("INFLUXDB_SNAPSHOT_REQUIRED");
    expect(source).toContain("InfluxDB snapshot is empty");
    expect(source).toContain('telemetry: { state: "SEALED"');
    expect(source).toContain("Platform backup identity changed before sealing");
  });
});

describe("DEP-BR restore validation contract", () => {
  it("fails closed on incompatible, tampered, incomplete and wrong-installation backups", async () => {
    const source = await readFile(
      join(process.cwd(), "src/modules/platform-backup/platform-backup.service.ts"),
      "utf8"
    );
    expect(source).toContain("Incompatible platform backup format");
    expect(source).toContain("Platform backup artifact checksum mismatch");
    expect(source).toContain("Platform backup artifact size mismatch");
    expect(source).toContain("Platform backup is incomplete");
    expect(source).toContain("Platform backup identity does not match this installation");
    expect(source).toContain("Platform backup contains an unsafe artifact path");
  });
});
