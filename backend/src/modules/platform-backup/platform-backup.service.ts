import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { sqlite } from "../../../database/sqlite/client";

export const PLATFORM_BACKUP_FORMAT_VERSION = 1;
const execFileAsync = promisify(execFile);

export interface PlatformBackupIdentity {
  installationId: string;
  customerCode: string;
  siteCode: string;
}

export interface PlatformBackupArtifact {
  kind: "sqlite" | "influxdb";
  file: string;
  bytes: number;
  sha256: string;
}

export interface PlatformBackupManifest {
  formatVersion: 1;
  backupId: string;
  createdAt: string;
  identity: PlatformBackupIdentity;
  artifacts: PlatformBackupArtifact[];
  telemetry:
    | {
        state: "PENDING_EXTERNAL_SNAPSHOT";
        reason: "INFLUXDB_SNAPSHOT_REQUIRED";
      }
    | {
        state: "SEALED";
        artifactCount: number;
      };
}

function requireValue(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is required for platform backup`);
  return normalized;
}

export function resolveAllowedBackupDestination(
  requestedDestination: string | undefined,
  environment: NodeJS.ProcessEnv = process.env
): string {
  const rootValue = requireValue(environment.BIOEMS_SQLITE_BACKUP_DIR, "BIOEMS_SQLITE_BACKUP_DIR");
  if (!isAbsolute(rootValue)) throw new Error("BIOEMS_SQLITE_BACKUP_DIR must be absolute");
  const root = resolve(rootValue);
  const requested = requestedDestination?.trim();
  const destination = requested ? resolve(requested) : root;
  const traversal = relative(root, destination);
  if (traversal.startsWith("..") || isAbsolute(traversal)) {
    throw new Error("Backup destination is outside the configured allowed root");
  }
  return destination;
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

export async function readInstalledBackupIdentity(
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupIdentity> {
  const receiptPath = requireValue(
    environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH,
    "BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH"
  );
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as {
    installationId?: string;
    customerSite?: { customerCode?: string; siteCode?: string };
  };
  return {
    installationId: requireValue(receipt.installationId, "installationId"),
    customerCode: requireValue(
      receipt.customerSite?.customerCode ?? environment.BIOEMS_INSTALLATION_CUSTOMER_CODE,
      "customerCode"
    ),
    siteCode: requireValue(
      receipt.customerSite?.siteCode ?? environment.BIOEMS_INSTALLATION_SITE_CODE,
      "siteCode"
    ),
  };
}

/**
 * Creates the SQLite-consistent part of a DEP-BR platform backup.
 *
 * A manifest with telemetry=PENDING_EXTERNAL_SNAPSHOT is intentionally not a
 * restorable backup. The Windows orchestration layer must add the matching
 * InfluxDB snapshot and seal the manifest before the backup can be offered for
 * restore.
 */
export async function createPlatformBackupFoundation(
  requestedDestination?: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<{ directory: string; manifest: PlatformBackupManifest }> {
  const root = resolveAllowedBackupDestination(requestedDestination, environment);
  const backupId = randomUUID();
  const directory = join(root, `platform-${backupId}`);
  await mkdir(directory, { recursive: false });

  const sqliteFile = join(directory, "bioems.sqlite");
  await sqlite.backup(sqliteFile);
  const sqliteStat = await stat(sqliteFile);
  const identity = await readInstalledBackupIdentity(environment);
  const manifest: PlatformBackupManifest = {
    formatVersion: PLATFORM_BACKUP_FORMAT_VERSION,
    backupId,
    createdAt: new Date().toISOString(),
    identity,
    artifacts: [
      {
        kind: "sqlite",
        file: basename(sqliteFile),
        bytes: sqliteStat.size,
        sha256: await sha256(sqliteFile),
      },
    ],
    telemetry: {
      state: "PENDING_EXTERNAL_SNAPSHOT",
      reason: "INFLUXDB_SNAPSHOT_REQUIRED",
    },
  };
  await writeFile(
    join(directory, "manifest.pending.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    {
      encoding: "utf8",
      flag: "wx",
    }
  );
  return { directory, manifest };
}

async function collectFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(root, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}

export async function sealPlatformBackup(
  directory: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupManifest> {
  const allowedRoot = resolveAllowedBackupDestination(undefined, environment);
  const normalizedDirectory = resolve(directory);
  const traversal = relative(allowedRoot, normalizedDirectory);
  if (traversal.startsWith("..") || isAbsolute(traversal)) {
    throw new Error("Backup directory is outside the configured allowed root");
  }

  const pendingPath = join(normalizedDirectory, "manifest.pending.json");
  const pending = JSON.parse(await readFile(pendingPath, "utf8")) as PlatformBackupManifest;
  if (pending.formatVersion !== PLATFORM_BACKUP_FORMAT_VERSION) {
    throw new Error("Unsupported platform backup format");
  }
  const currentIdentity = await readInstalledBackupIdentity(environment);
  if (
    pending.identity.installationId !== currentIdentity.installationId ||
    pending.identity.customerCode !== currentIdentity.customerCode ||
    pending.identity.siteCode !== currentIdentity.siteCode
  ) {
    throw new Error("Platform backup identity changed before sealing");
  }

  const influxRoot = join(normalizedDirectory, "influxdb");
  const influxFiles = await collectFiles(influxRoot);
  if (influxFiles.length === 0) throw new Error("InfluxDB snapshot is empty");

  const influxArtifacts: PlatformBackupArtifact[] = [];
  for (const relativeFile of influxFiles) {
    const fullPath = join(influxRoot, relativeFile);
    const fileStat = await stat(fullPath);
    influxArtifacts.push({
      kind: "influxdb",
      file: join("influxdb", relativeFile).replaceAll("\\", "/"),
      bytes: fileStat.size,
      sha256: await sha256(fullPath),
    });
  }

  const manifest: PlatformBackupManifest = {
    ...pending,
    artifacts: [...pending.artifacts, ...influxArtifacts],
    telemetry: { state: "SEALED", artifactCount: influxArtifacts.length },
  };
  const finalPath = join(normalizedDirectory, "manifest.json");
  await writeFile(finalPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(pendingPath, join(normalizedDirectory, "manifest.sealed-source.json"));
  return manifest;
}

export interface PlatformBackupListItem {
  backupId: string;
  createdAt: string;
  identity: PlatformBackupIdentity;
  artifactCount: number;
  totalBytes: number;
  telemetryState: PlatformBackupManifest["telemetry"]["state"];
}

export async function listPlatformBackups(
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupListItem[]> {
  const root = resolveAllowedBackupDestination(undefined, environment);
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw error;
  }

  const backups: PlatformBackupListItem[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("platform-")) continue;
    const manifestPath = join(root, entry.name, "manifest.json");
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PlatformBackupManifest;
      if (
        manifest.formatVersion !== PLATFORM_BACKUP_FORMAT_VERSION ||
        manifest.telemetry.state !== "SEALED"
      ) {
        continue;
      }
      backups.push({
        backupId: manifest.backupId,
        createdAt: manifest.createdAt,
        identity: manifest.identity,
        artifactCount: manifest.artifacts.length,
        totalBytes: manifest.artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
        telemetryState: manifest.telemetry.state,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return backups.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function resolveInfluxBackupCommand(environment: NodeJS.ProcessEnv): {
  executable: string;
  script: string;
} {
  return {
    executable: requireValue(environment.BIOEMS_POWERSHELL_PATH ?? "powershell.exe", "PowerShell"),
    script: requireValue(environment.BIOEMS_INFLUX_BACKUP_SCRIPT, "BIOEMS_INFLUX_BACKUP_SCRIPT"),
  };
}

export async function createCompletePlatformBackup(
  requestedDestination?: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupManifest> {
  const { directory } = await createPlatformBackupFoundation(requestedDestination, environment);
  const { executable, script } = resolveInfluxBackupCommand(environment);
  const influxCli = requireValue(environment.BIOEMS_INFLUX_CLI_PATH, "BIOEMS_INFLUX_CLI_PATH");
  const hostUrl = requireValue(environment.INFLUX_URL, "INFLUX_URL");
  const org = requireValue(environment.INFLUX_ORG, "INFLUX_ORG");
  const token = requireValue(environment.INFLUX_TOKEN, "INFLUX_TOKEN");
  const influxDirectory = join(directory, "influxdb");

  await execFileAsync(
    executable,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      script,
      "-InfluxCli",
      influxCli,
      "-BackupDirectory",
      influxDirectory,
      "-HostUrl",
      hostUrl,
      "-Org",
      org,
    ],
    {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      env: { ...environment, INFLUX_TOKEN: token },
    }
  );

  return sealPlatformBackup(directory, environment);
}

export interface PlatformBackupValidationResult {
  directory: string;
  manifest: PlatformBackupManifest;
}

function assertSafeArtifactPath(directory: string, artifactFile: string): string {
  const fullPath = resolve(directory, artifactFile);
  const traversal = relative(directory, fullPath);
  if (!artifactFile || traversal.startsWith("..") || isAbsolute(traversal)) {
    throw new Error("Platform backup contains an unsafe artifact path");
  }
  return fullPath;
}

export async function validatePlatformBackupForRestore(
  backupId: string,
  options: { allowIdentityTransfer?: boolean } = {},
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupValidationResult> {
  if (!/^[0-9a-f-]{36}$/i.test(backupId)) throw new Error("Invalid platform backup id");
  const root = resolveAllowedBackupDestination(undefined, environment);
  const directory = join(root, `platform-${backupId}`);
  const manifest = JSON.parse(
    await readFile(join(directory, "manifest.json"), "utf8")
  ) as PlatformBackupManifest;

  if (manifest.formatVersion !== PLATFORM_BACKUP_FORMAT_VERSION) {
    throw new Error("Incompatible platform backup format");
  }
  if (manifest.backupId !== backupId || manifest.telemetry.state !== "SEALED") {
    throw new Error("Platform backup is not sealed for restore");
  }

  const artifactKinds = new Set(manifest.artifacts.map((artifact) => artifact.kind));
  if (!artifactKinds.has("sqlite") || !artifactKinds.has("influxdb")) {
    throw new Error("Platform backup is incomplete");
  }

  for (const artifact of manifest.artifacts) {
    const artifactPath = assertSafeArtifactPath(directory, artifact.file);
    const artifactStat = await stat(artifactPath);
    if (!artifactStat.isFile() || artifactStat.size !== artifact.bytes) {
      throw new Error("Platform backup artifact size mismatch");
    }
    if ((await sha256(artifactPath)) !== artifact.sha256) {
      throw new Error("Platform backup artifact checksum mismatch");
    }
  }

  if (!options.allowIdentityTransfer) {
    const currentIdentity = await readInstalledBackupIdentity(environment);
    if (
      manifest.identity.installationId !== currentIdentity.installationId ||
      manifest.identity.customerCode !== currentIdentity.customerCode ||
      manifest.identity.siteCode !== currentIdentity.siteCode
    ) {
      throw new Error("Platform backup identity does not match this installation");
    }
  }

  return { directory, manifest };
}

export async function restorePlatformBackup(
  backupId: string,
  options: { allowIdentityTransfer?: boolean } = {},
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupManifest> {
  const validated = await validatePlatformBackupForRestore(backupId, options, environment);
  const executable = requireValue(
    environment.BIOEMS_POWERSHELL_PATH ?? "powershell.exe",
    "PowerShell"
  );
  const script = requireValue(
    environment.BIOEMS_PLATFORM_RESTORE_SCRIPT,
    "BIOEMS_PLATFORM_RESTORE_SCRIPT"
  );
  const applicationRoot = requireValue(
    environment.BIOEMS_APPLICATION_ROOT,
    "BIOEMS_APPLICATION_ROOT"
  );
  const persistentRoot = requireValue(environment.BIOEMS_PERSISTENT_ROOT, "BIOEMS_PERSISTENT_ROOT");
  const influxCli = requireValue(environment.BIOEMS_INFLUX_CLI_PATH, "BIOEMS_INFLUX_CLI_PATH");
  const hostUrl = requireValue(environment.INFLUX_URL, "INFLUX_URL");
  const org = requireValue(environment.INFLUX_ORG, "INFLUX_ORG");
  const token = requireValue(environment.INFLUX_TOKEN, "INFLUX_TOKEN");

  await execFileAsync(
    executable,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      script,
      "-ApplicationRoot",
      applicationRoot,
      "-PersistentRoot",
      persistentRoot,
      "-BackupDirectory",
      validated.directory,
      "-InfluxCli",
      influxCli,
      "-HostUrl",
      hostUrl,
      "-Org",
      org,
    ],
    {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      env: { ...environment, INFLUX_TOKEN: token },
    }
  );

  return validated.manifest;
}
