import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hasPermission } from "../../authorization/authorization.policy";
import { PERMISSION } from "../../authorization/permissions";
import {
  resolveAllowedBackupDestination,
  validatePlatformBackupForRestore,
} from "./platform-backup.service";

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
    expect(source).toContain("platform-backup.log");
    expect(source).toContain("Diagnostic logging must never mask the original backup failure");
    expect(source).toContain(
      "if (directory) await rm(directory, { recursive: true, force: true })"
    );
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

describe("DEP-BR restore validation behavior", () => {
  async function fixture(
    identity = {
      installationId: randomUUID(),
      customerCode: "CUST-1",
      siteCode: "SITE-1",
    }
  ) {
    const root = await mkdtemp(join(tmpdir(), "bioems-restore-"));
    const backupId = randomUUID();
    const directory = join(root, `platform-${backupId}`);
    await mkdir(join(directory, "influxdb"), { recursive: true });
    const sqlite = Buffer.from("sqlite-backup");
    const influx = Buffer.from("influx-backup");
    await writeFile(join(directory, "bioems.sqlite"), sqlite);
    await writeFile(join(directory, "influxdb", "snapshot.bin"), influx);
    const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
    const manifest = {
      formatVersion: 1,
      backupId,
      createdAt: new Date().toISOString(),
      identity,
      artifacts: [
        { kind: "sqlite", file: "bioems.sqlite", bytes: sqlite.length, sha256: sha(sqlite) },
        {
          kind: "influxdb",
          file: "influxdb/snapshot.bin",
          bytes: influx.length,
          sha256: sha(influx),
        },
      ],
      telemetry: { state: "SEALED", artifactCount: 1 },
    };
    await writeFile(join(directory, "manifest.json"), JSON.stringify(manifest));
    const receipt = join(root, "receipt.json");
    await writeFile(
      receipt,
      JSON.stringify({ installationId: identity.installationId, customerSite: identity })
    );
    return {
      root,
      backupId,
      directory,
      identity,
      environment: {
        BIOEMS_SQLITE_BACKUP_DIR: root,
        BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH: receipt,
      } as NodeJS.ProcessEnv,
    };
  }

  it("accepts a sealed same-installation backup with intact artifacts", async () => {
    const value = await fixture();
    await expect(
      validatePlatformBackupForRestore(value.backupId, {}, value.environment)
    ).resolves.toMatchObject({
      manifest: { backupId: value.backupId },
    });
  });

  it("rejects a malformed sealed manifest before artifact restore", async () => {
    const value = await fixture();
    const manifestPath = join(value.directory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.identity = { installationId: value.identity.installationId };
    await writeFile(manifestPath, JSON.stringify(manifest));
    await expect(
      validatePlatformBackupForRestore(value.backupId, {}, value.environment)
    ).rejects.toThrow("manifest schema is invalid");
  });

  it("rejects a sealed manifest whose telemetry count does not match its Influx artifacts", async () => {
    const value = await fixture();
    const manifestPath = join(value.directory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.telemetry.artifactCount = 99;
    await writeFile(manifestPath, JSON.stringify(manifest));
    await expect(
      validatePlatformBackupForRestore(value.backupId, {}, value.environment)
    ).rejects.toThrow("telemetry count is invalid");
  });

  it("rejects a tampered artifact", async () => {
    const value = await fixture();
    await writeFile(join(value.directory, "bioems.sqlite"), "tampered");
    await expect(
      validatePlatformBackupForRestore(value.backupId, {}, value.environment)
    ).rejects.toThrow(/size mismatch|checksum mismatch/);
  });

  it("rejects a wrong installation for normal restore", async () => {
    const value = await fixture();
    await writeFile(
      value.environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH!,
      JSON.stringify({
        installationId: randomUUID(),
        customerSite: { customerCode: "OTHER", siteCode: "OTHER" },
      })
    );
    await expect(
      validatePlatformBackupForRestore(value.backupId, {}, value.environment)
    ).rejects.toThrow("does not match this installation");
  });

  it("allows identity mismatch only when the caller explicitly enables DR transfer", async () => {
    const value = await fixture();
    await writeFile(
      value.environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH!,
      JSON.stringify({
        installationId: randomUUID(),
        customerSite: { customerCode: "OTHER", siteCode: "OTHER" },
      })
    );
    await expect(
      validatePlatformBackupForRestore(
        value.backupId,
        { allowIdentityTransfer: true },
        value.environment
      )
    ).resolves.toMatchObject({ manifest: { backupId: value.backupId } });
  });
});

describe("DEP-BR malicious backup rejection", () => {
  it("uses strict UUID and rejects duplicate artifacts and symlinks before restore", async () => {
    const source = await readFile(
      join(process.cwd(), "src/modules/platform-backup/platform-backup.service.ts"),
      "utf8"
    );
    expect(source).toContain("[1-5][0-9a-f]{3}");
    expect(source).toContain("Platform backup contains duplicate artifact paths");
    expect(source).toContain("Platform backup SQLite artifact is invalid");
    expect(source).toContain("Platform backup artifact symlinks are not allowed");
    expect(source).toContain("Platform backup artifact resolves outside the backup directory");
  });

  it("rejects malformed backup ids before reading a backup directory", async () => {
    await expect(
      validatePlatformBackupForRestore(
        "../outside",
        {},
        {
          BIOEMS_SQLITE_BACKUP_DIR: "/var/lib/bioems/backups",
        }
      )
    ).rejects.toThrow("Invalid platform backup id");
  });
});
