import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  appendFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { sqlite } from "../../../database/sqlite/client";
import { AuditActorSnapshot } from "../../entities/AuditEvent";
import { auditEventService } from "../../services/audit-event.service";

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
  source?: "MANUAL" | "AUTOMATIC";
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
  environment: NodeJS.ProcessEnv = process.env,
  source: "MANUAL" | "AUTOMATIC" = "MANUAL"
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
    source,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSealedPlatformBackupManifest(value: unknown): PlatformBackupManifest {
  if (!isRecord(value) || value.formatVersion !== PLATFORM_BACKUP_FORMAT_VERSION) {
    throw new Error("Incompatible platform backup format");
  }
  if (
    typeof value.backupId !== "string" ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    !isRecord(value.identity) ||
    typeof value.identity.installationId !== "string" ||
    typeof value.identity.customerCode !== "string" ||
    typeof value.identity.siteCode !== "string" ||
    !Array.isArray(value.artifacts) ||
    !isRecord(value.telemetry) ||
    value.telemetry.state !== "SEALED" ||
    typeof value.telemetry.artifactCount !== "number"
  ) {
    throw new Error("Platform backup manifest schema is invalid");
  }
  for (const artifact of value.artifacts) {
    if (
      !isRecord(artifact) ||
      (artifact.kind !== "sqlite" && artifact.kind !== "influxdb") ||
      typeof artifact.file !== "string" ||
      typeof artifact.bytes !== "number" ||
      !Number.isSafeInteger(artifact.bytes) ||
      artifact.bytes < 0 ||
      typeof artifact.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/i.test(artifact.sha256)
    ) {
      throw new Error("Platform backup manifest schema is invalid");
    }
  }
  if (
    value.telemetry.artifactCount !==
    value.artifacts.filter((artifact) => isRecord(artifact) && artifact.kind === "influxdb").length
  ) {
    throw new Error("Platform backup manifest telemetry count is invalid");
  }
  return value as unknown as PlatformBackupManifest;
}

async function assertSafeBackupDirectory(root: string, directory: string): Promise<void> {
  const rootReal = await realpath(root);
  const directoryEntry = await lstat(directory);
  if (directoryEntry.isSymbolicLink() || !directoryEntry.isDirectory()) {
    throw new Error("Platform backup directory must be a real directory");
  }
  const directoryReal = await realpath(directory);
  const traversal = relative(rootReal, directoryReal);
  if (traversal.startsWith("..") || isAbsolute(traversal)) {
    throw new Error("Platform backup directory resolves outside the configured allowed root");
  }
}

export interface PlatformBackupListItem {
  backupId: string;
  createdAt: string;
  source: "MANUAL" | "AUTOMATIC";
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
        source: manifest.source === "AUTOMATIC" ? "AUTOMATIC" : "MANUAL",
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

export async function prunePlatformBackups(
  retentionCount: number,
  environment: NodeJS.ProcessEnv = process.env
): Promise<number> {
  if (!Number.isInteger(retentionCount) || retentionCount < 1 || retentionCount > 30) {
    throw new Error("Platform backup retention count must be between 1 and 30");
  }
  const root = resolveAllowedBackupDestination(undefined, environment);
  const backups = await listPlatformBackups(environment);
  const expired = backups.slice(retentionCount);
  for (const backup of expired) {
    const directory = join(root, `platform-${backup.backupId}`);
    await assertSafeBackupDirectory(root, directory);
    await rm(directory, { recursive: true, force: false });
  }
  return expired.length;
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

function backupFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown platform backup failure";
  const processError = error as Error & { code?: string | number; stderr?: string };
  const details = [
    error.message,
    processError.code === undefined ? "" : `exitCode=${processError.code}`,
    processError.stderr?.trim() ?? "",
  ].filter(Boolean);
  return details.join(" | ").replaceAll(/INFLUX_TOKEN=[^\s|]+/gi, "INFLUX_TOKEN=<redacted>");
}

async function recordPlatformBackupFailure(
  directory: string,
  error: unknown,
  environment: NodeJS.ProcessEnv
): Promise<void> {
  const persistentRoot = environment.BIOEMS_PERSISTENT_ROOT?.trim();
  if (!persistentRoot || !isAbsolute(persistentRoot)) return;
  const logDirectory = join(resolve(persistentRoot), "logs");
  await mkdir(logDirectory, { recursive: true });
  const line = `${new Date().toISOString()} backup=${basename(directory)} failed: ${backupFailureMessage(error)}\n`;
  await appendFile(join(logDirectory, "platform-backup.log"), line, "utf8");
}

export async function createCompletePlatformBackup(
  requestedDestination?: string,
  environment: NodeJS.ProcessEnv = process.env,
  source: "MANUAL" | "AUTOMATIC" = "MANUAL"
): Promise<PlatformBackupManifest> {
  let directory: string | undefined;
  try {
    ({ directory } = await createPlatformBackupFoundation(
      requestedDestination,
      environment,
      source
    ));
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

    return await sealPlatformBackup(directory, environment);
  } catch (error) {
    try {
      if (directory) await recordPlatformBackupFailure(directory, error, environment);
    } catch {
      // Diagnostic logging must never mask the original backup failure.
    }
    if (directory) await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

export interface PlatformBackupValidationResult {
  directory: string;
  manifest: PlatformBackupManifest;
}

async function assertSafeArtifactPath(directory: string, artifactFile: string): Promise<string> {
  const fullPath = resolve(directory, artifactFile);
  const traversal = relative(directory, fullPath);
  if (!artifactFile || traversal.startsWith("..") || isAbsolute(traversal)) {
    throw new Error("Platform backup contains an unsafe artifact path");
  }
  const entry = await lstat(fullPath);
  if (entry.isSymbolicLink()) throw new Error("Platform backup artifact symlinks are not allowed");
  const realDirectory = await realpath(directory);
  const realArtifact = await realpath(fullPath);
  const realTraversal = relative(realDirectory, realArtifact);
  if (realTraversal.startsWith("..") || isAbsolute(realTraversal)) {
    throw new Error("Platform backup artifact resolves outside the backup directory");
  }
  return fullPath;
}

export async function validatePlatformBackupForRestore(
  backupId: string,
  options: { allowIdentityTransfer?: boolean } = {},
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformBackupValidationResult> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(backupId)
  ) {
    throw new Error("Invalid platform backup id");
  }
  const root = resolveAllowedBackupDestination(undefined, environment);
  const directory = join(root, `platform-${backupId}`);
  await assertSafeBackupDirectory(root, directory);
  const manifest = parseSealedPlatformBackupManifest(
    JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) as unknown
  );
  if (manifest.backupId !== backupId || manifest.telemetry.state !== "SEALED") {
    throw new Error("Platform backup is not sealed for restore");
  }

  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length < 2) {
    throw new Error("Platform backup is incomplete");
  }
  const artifactFiles = manifest.artifacts.map((artifact) => artifact.file);
  if (new Set(artifactFiles).size !== artifactFiles.length) {
    throw new Error("Platform backup contains duplicate artifact paths");
  }
  const sqliteArtifacts = manifest.artifacts.filter((artifact) => artifact.kind === "sqlite");
  if (sqliteArtifacts.length !== 1 || sqliteArtifacts[0]?.file !== "bioems.sqlite") {
    throw new Error("Platform backup SQLite artifact is invalid");
  }
  const artifactKinds = new Set(manifest.artifacts.map((artifact) => artifact.kind));
  if (!artifactKinds.has("sqlite") || !artifactKinds.has("influxdb")) {
    throw new Error("Platform backup is incomplete");
  }

  for (const artifact of manifest.artifacts) {
    const artifactPath = await assertSafeArtifactPath(directory, artifact.file);
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

export type PlatformRestoreJobState = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface PlatformRestoreJobStatus {
  jobId: string;
  backupId: string;
  state: PlatformRestoreJobState;
  queuedAt: string;
  updatedAt: string;
  allowIdentityTransfer: boolean;
  identity: PlatformBackupIdentity;
  audit?: {
    actor: AuditActorSnapshot;
    source: string;
    finalAuditEventId: string;
  };
  error?: string;
}

export interface PlatformRestoreJob {
  backup: PlatformBackupManifest;
  queued: true;
  safetyDirectory: string;
  status: PlatformRestoreJobStatus;
}

function restoreJobDirectory(environment: NodeJS.ProcessEnv): string {
  return join(
    requireValue(environment.BIOEMS_PERSISTENT_ROOT, "BIOEMS_PERSISTENT_ROOT"),
    "restore-jobs"
  );
}

function restoreJobPath(jobId: string, environment: NodeJS.ProcessEnv): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
    throw new Error("Invalid platform restore job id");
  }
  return join(restoreJobDirectory(environment), `${jobId}.json`);
}

async function assertSafeRestoreJobPath(
  jobId: string,
  environment: NodeJS.ProcessEnv
): Promise<string> {
  const directory = restoreJobDirectory(environment);
  const path = restoreJobPath(jobId, environment);
  const directoryEntry = await lstat(directory);
  if (directoryEntry.isSymbolicLink() || !directoryEntry.isDirectory()) {
    throw new Error("Platform restore job directory must be a real directory");
  }
  const directoryReal = await realpath(directory);
  const persistentRootReal = await realpath(
    requireValue(environment.BIOEMS_PERSISTENT_ROOT, "BIOEMS_PERSISTENT_ROOT")
  );
  const directoryTraversal = relative(persistentRootReal, directoryReal);
  if (directoryTraversal.startsWith("..") || isAbsolute(directoryTraversal)) {
    throw new Error("Platform restore job directory resolves outside the persistent root");
  }
  const entry = await lstat(path);
  if (entry.isSymbolicLink() || !entry.isFile()) {
    throw new Error("Platform restore job status must be a real file");
  }
  const pathReal = await realpath(path);
  const traversal = relative(directoryReal, pathReal);
  if (traversal.startsWith("..") || isAbsolute(traversal)) {
    throw new Error("Platform restore job status resolves outside the restore job directory");
  }
  return path;
}

export async function getPlatformRestoreJob(
  jobId: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformRestoreJobStatus> {
  const path = await assertSafeRestoreJobPath(jobId, environment);
  // Windows PowerShell 5 writes a UTF-8 BOM when `-Encoding UTF8` is used.
  // Accept status files produced by older restore workers while keeping JSON
  // validation fail-closed for every other malformed payload.
  const serialized = await readFile(path, "utf8");
  const value = JSON.parse(serialized.replace(/^\uFEFF/, "")) as unknown;
  if (
    !isRecord(value) ||
    value.jobId !== jobId ||
    typeof value.backupId !== "string" ||
    !["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"].includes(String(value.state)) ||
    typeof value.queuedAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    typeof value.allowIdentityTransfer !== "boolean" ||
    !isRecord(value.identity) ||
    typeof value.identity.installationId !== "string" ||
    typeof value.identity.customerCode !== "string" ||
    typeof value.identity.siteCode !== "string"
  ) {
    throw new Error("Platform restore job status is invalid");
  }
  if (value.audit !== undefined) {
    if (
      !isRecord(value.audit) ||
      !isRecord(value.audit.actor) ||
      !["CUSTOMER_USER", "PLATFORM"].includes(String(value.audit.actor.kind)) ||
      typeof value.audit.actor.id !== "string" ||
      typeof value.audit.actor.username !== "string" ||
      typeof value.audit.actor.role !== "string" ||
      typeof value.audit.source !== "string" ||
      !value.audit.source.trim() ||
      typeof value.audit.finalAuditEventId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.audit.finalAuditEventId
      )
    ) {
      throw new Error("Platform restore job audit metadata is invalid");
    }
  }
  return value as unknown as PlatformRestoreJobStatus;
}

export async function getLatestPlatformRestoreJob(
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformRestoreJobStatus | null> {
  const directory = restoreJobDirectory(environment);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  const jobs: PlatformRestoreJobStatus[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/i.test(entry.name)) continue;
    try {
      jobs.push(await getPlatformRestoreJob(entry.name.slice(0, -5), environment));
    } catch {
      // Ignore malformed or transient status files; direct job lookup remains fail-closed.
    }
  }
  return (
    jobs.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0] ?? null
  );
}

export function recordPlatformRestoreTerminalAudit(job: PlatformRestoreJobStatus): void {
  if (!job.audit || (job.state !== "SUCCEEDED" && job.state !== "FAILED")) return;
  auditEventService.recordOnce(job.audit.finalAuditEventId, {
    actor: job.audit.actor,
    action: "PLATFORM_BACKUP.RESTORE_COMPLETED",
    target: { type: "PLATFORM_BACKUP", id: job.backupId },
    result: job.state === "SUCCEEDED" ? "SUCCESS" : "FAILED",
    newValues: {
      restoreJobId: job.jobId,
      restoreState: job.state,
      identityTransfer: job.allowIdentityTransfer,
    },
    requestContext: { source: job.audit.source },
    reason:
      job.state === "SUCCEEDED"
        ? "Restore worker reported successful completion"
        : (job.error ?? "Restore worker reported failure after rollback handling"),
  });
}

export async function reconcilePlatformRestoreAudits(
  environment: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const directory = restoreJobDirectory(environment);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const jobId = entry.name.slice(0, -5);
    let job: PlatformRestoreJobStatus;
    try {
      job = await getPlatformRestoreJob(jobId, environment);
    } catch {
      continue;
    }
    recordPlatformRestoreTerminalAudit(job);
  }
}

export async function restorePlatformBackup(
  backupId: string,
  options: {
    allowIdentityTransfer?: boolean;
    audit?: { actor: AuditActorSnapshot; source: string };
  } = {},
  environment: NodeJS.ProcessEnv = process.env
): Promise<PlatformRestoreJob> {
  const validated = await validatePlatformBackupForRestore(backupId, options, environment);
  requireValue(environment.BIOEMS_PLATFORM_RESTORE_SCRIPT, "BIOEMS_PLATFORM_RESTORE_SCRIPT");
  const influxCli = requireValue(environment.BIOEMS_INFLUX_CLI_PATH, "BIOEMS_INFLUX_CLI_PATH");
  const hostUrl = requireValue(environment.INFLUX_URL, "INFLUX_URL");
  const org = requireValue(environment.INFLUX_ORG, "INFLUX_ORG");
  const token = requireValue(environment.INFLUX_TOKEN, "INFLUX_TOKEN");
  const jobId = randomUUID();
  const queuedAt = new Date().toISOString();
  const status: PlatformRestoreJobStatus = {
    jobId,
    backupId,
    state: "QUEUED",
    queuedAt,
    updatedAt: queuedAt,
    allowIdentityTransfer: options.allowIdentityTransfer === true,
    identity: validated.manifest.identity,
    audit: options.audit ? { ...options.audit, finalAuditEventId: randomUUID() } : undefined,
  };
  const jobsDirectory = restoreJobDirectory(environment);
  await mkdir(jobsDirectory, { recursive: true });
  const statusPath = restoreJobPath(jobId, environment);
  await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });

  // Take the SQLite safety snapshot while this process still owns a live,
  // WAL-consistent database connection. The external worker will take the
  // supported InfluxDB safety backup before quiescing services.
  const safetyDirectory = join(
    resolveAllowedBackupDestination(undefined, environment),
    `restore-safety-${randomUUID()}`
  );
  const requestPath = join(jobsDirectory, `${jobId}.request.json`);
  const temporaryRequestPath = `${requestPath}.tmp`;
  try {
    await mkdir(safetyDirectory, { recursive: false });
    await sqlite.backup(join(safetyDirectory, "bioems.sqlite"));
    void token;
    await writeFile(
      temporaryRequestPath,
      `${JSON.stringify({ backupDirectory: validated.directory, safetyDirectory, influxCli, hostUrl, org }, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" }
    );
    await rename(temporaryRequestPath, requestPath);
  } catch (error) {
    status.state = "FAILED";
    status.updatedAt = new Date().toISOString();
    status.error = error instanceof Error ? error.message : "Restore request preparation failed";
    await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
    await rm(temporaryRequestPath, { force: true });
    await rm(safetyDirectory, { recursive: true, force: true });
    throw error;
  }

  return { backup: validated.manifest, queued: true, safetyDirectory, status };
}
