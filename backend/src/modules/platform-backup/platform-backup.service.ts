import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { sqlite } from "../../../database/sqlite/client";

export const PLATFORM_BACKUP_FORMAT_VERSION = 1;

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
