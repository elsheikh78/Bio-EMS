import { Request, Response } from "express";
import {
  platformAuditActor,
  platformRequestContext,
} from "../modules/audit/platform-audit-context";
import { auditEventService } from "../services/audit-event.service";
import { customerAuditActor } from "../modules/audit/customer-audit-context";
import {
  createCompletePlatformBackup,
  getPlatformRestoreJob,
  listPlatformBackups,
  readInstalledBackupIdentity,
  recordPlatformRestoreTerminalAudit,
  restorePlatformBackup,
} from "../modules/platform-backup/platform-backup.service";
import {
  getPlatformBackupSchedule,
  updatePlatformBackupSchedule,
} from "../modules/platform-backup/platform-backup-schedule.service";
import type { PlatformBackupScheduleInput } from "../modules/platform-backup/platform-backup-schedule.schema";

export async function listCustomerPlatformBackups(_req: Request, res: Response): Promise<void> {
  const backups = await listPlatformBackups();
  res.status(200).json({ backups });
}

export async function listOwnerPlatformBackups(_req: Request, res: Response): Promise<void> {
  const backups = await listPlatformBackups();
  res.status(200).json({ backups });
}

export function getCustomerPlatformBackupSchedule(_req: Request, res: Response): void {
  res.status(200).json({ schedule: getPlatformBackupSchedule() });
}

export function updateCustomerPlatformBackupSchedule(req: Request, res: Response): void {
  const actor = customerAuditActor(req);
  const schedule = updatePlatformBackupSchedule(
    req.body as PlatformBackupScheduleInput,
    actor.username
  );
  res.status(200).json({ schedule });
}

export function getOwnerPlatformBackupSchedule(_req: Request, res: Response): void {
  res.status(200).json({ schedule: getPlatformBackupSchedule() });
}

export function updateOwnerPlatformBackupSchedule(req: Request, res: Response): void {
  const actor = platformAuditActor(req);
  const schedule = updatePlatformBackupSchedule(
    req.body as PlatformBackupScheduleInput,
    actor.username
  );
  res.status(200).json({ schedule });
}

export async function createCustomerPlatformBackup(_req: Request, res: Response): Promise<void> {
  const manifest = await createCompletePlatformBackup(undefined, process.env, "MANUAL");
  res.status(201).json({ backup: manifest });
}

export async function createOwnerPlatformBackup(_req: Request, res: Response): Promise<void> {
  const manifest = await createCompletePlatformBackup(undefined, process.env, "MANUAL");
  res.status(201).json({ backup: manifest });
}

function requireJobId(req: Request): string {
  const value = req.params.jobId;
  const jobId = Array.isArray(value) ? value[0] : value;
  if (!jobId) throw new Error("Platform restore job id is required");
  return jobId;
}

export async function getCustomerPlatformRestoreJob(req: Request, res: Response): Promise<void> {
  const restoreJob = await getPlatformRestoreJob(requireJobId(req));
  const installedIdentity = await readInstalledBackupIdentity();
  if (
    restoreJob.identity.installationId !== installedIdentity.installationId ||
    restoreJob.identity.customerCode !== installedIdentity.customerCode ||
    restoreJob.identity.siteCode !== installedIdentity.siteCode
  ) {
    res.status(404).json({
      success: false,
      error: { code: "RESTORE_JOB_NOT_FOUND", message: "Platform restore job was not found" },
    });
    return;
  }
  recordPlatformRestoreTerminalAudit(restoreJob);
  res.status(200).json({ restoreJob });
}

export async function getOwnerPlatformRestoreJob(req: Request, res: Response): Promise<void> {
  const restoreJob = await getPlatformRestoreJob(requireJobId(req));
  recordPlatformRestoreTerminalAudit(restoreJob);
  res.status(200).json({ restoreJob });
}

function requireBackupId(req: Request): string {
  const value = req.params.backupId;
  const backupId = Array.isArray(value) ? value[0] : value;
  if (!backupId) throw new Error("Platform backup id is required");
  return backupId;
}

export async function restoreCustomerPlatformBackup(req: Request, res: Response): Promise<void> {
  const job = await restorePlatformBackup(requireBackupId(req), {
    allowIdentityTransfer: false,
    audit: { actor: customerAuditActor(req), source: "platform-backup-restore" },
  });
  res.status(202).json({ backup: job.backup, restoreQueued: true, restoreJob: job.status });
}

export async function restoreOwnerPlatformBackup(req: Request, res: Response): Promise<void> {
  const job = await restorePlatformBackup(requireBackupId(req), {
    allowIdentityTransfer: false,
    audit: { actor: platformAuditActor(req), source: "platform-backup-restore" },
  });
  res.status(202).json({ backup: job.backup, restoreQueued: true, restoreJob: job.status });
}

export async function restoreOwnerPlatformBackupForDisasterRecovery(
  req: Request,
  res: Response
): Promise<void> {
  const backupId = requireBackupId(req);
  const confirmation = req.body?.confirmation;
  if (confirmation !== "TRANSFER_INSTALLATION_IDENTITY") {
    auditEventService.record({
      actor: platformAuditActor(req),
      action: "PLATFORM_BACKUP.DR_RESTORE",
      target: { type: "PLATFORM_BACKUP", id: backupId },
      result: "DENIED",
      requestContext: platformRequestContext(req, "platform-backup-dr"),
      reason: "Explicit disaster-recovery identity-transfer confirmation was not supplied",
    });
    res.status(400).json({
      success: false,
      error: {
        code: "DR_CONFIRMATION_REQUIRED",
        message: "Explicit disaster-recovery identity-transfer confirmation is required",
      },
    });
    return;
  }

  try {
    const job = await restorePlatformBackup(backupId, {
      allowIdentityTransfer: true,
      audit: { actor: platformAuditActor(req), source: "platform-backup-dr" },
    });
    auditEventService.record({
      actor: platformAuditActor(req),
      action: "PLATFORM_BACKUP.DR_RESTORE_QUEUED",
      target: { type: "PLATFORM_BACKUP", id: backupId },
      result: "SUCCESS",
      newValues: {
        restoreJobId: job.status.jobId,
        restoreState: job.status.state,
        installationId: job.backup.identity.installationId,
        customerCode: job.backup.identity.customerCode,
        siteCode: job.backup.identity.siteCode,
      },
      requestContext: platformRequestContext(req, "platform-backup-dr"),
      reason: "Controlled PC replacement/disaster recovery identity transfer accepted and queued",
    });
    res.status(202).json({
      backup: job.backup,
      restoreQueued: true,
      identityTransferQueued: true,
      restoreJob: job.status,
    });
  } catch (error) {
    auditEventService.record({
      actor: platformAuditActor(req),
      action: "PLATFORM_BACKUP.DR_RESTORE",
      target: { type: "PLATFORM_BACKUP", id: backupId },
      result: "FAILED",
      requestContext: platformRequestContext(req, "platform-backup-dr"),
      reason: error instanceof Error ? error.message : "Controlled disaster recovery failed",
    });
    throw error;
  }
}
