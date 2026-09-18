import { Request, Response } from "express";
import { platformAuditActor, platformRequestContext } from "../modules/audit/platform-audit-context";
import { auditEventService } from "../services/audit-event.service";
import {
  createCompletePlatformBackup,
  listPlatformBackups,
  restorePlatformBackup,
} from "../modules/platform-backup/platform-backup.service";

export async function listCustomerPlatformBackups(_req: Request, res: Response): Promise<void> {
  const backups = await listPlatformBackups();
  res.status(200).json({ backups });
}

export async function listOwnerPlatformBackups(_req: Request, res: Response): Promise<void> {
  const backups = await listPlatformBackups();
  res.status(200).json({ backups });
}

export async function createCustomerPlatformBackup(_req: Request, res: Response): Promise<void> {
  const manifest = await createCompletePlatformBackup();
  res.status(201).json({ backup: manifest });
}

export async function createOwnerPlatformBackup(_req: Request, res: Response): Promise<void> {
  const manifest = await createCompletePlatformBackup();
  res.status(201).json({ backup: manifest });
}

function requireBackupId(req: Request): string {
  const backupId = req.params.backupId;
  if (!backupId) throw new Error("Platform backup id is required");
  return backupId;
}

export async function restoreCustomerPlatformBackup(req: Request, res: Response): Promise<void> {
  const manifest = await restorePlatformBackup(requireBackupId(req), {
    allowIdentityTransfer: false,
  });
  res.status(200).json({ backup: manifest, restored: true });
}

export async function restoreOwnerPlatformBackup(req: Request, res: Response): Promise<void> {
  const manifest = await restorePlatformBackup(requireBackupId(req), {
    allowIdentityTransfer: false,
  });
  res.status(200).json({ backup: manifest, restored: true });
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
    const manifest = await restorePlatformBackup(backupId, { allowIdentityTransfer: true });
    auditEventService.record({
      actor: platformAuditActor(req),
      action: "PLATFORM_BACKUP.DR_RESTORE",
      target: { type: "PLATFORM_BACKUP", id: backupId },
      result: "SUCCESS",
      newValues: {
        installationId: manifest.identity.installationId,
        customerCode: manifest.identity.customerCode,
        siteCode: manifest.identity.siteCode,
      },
      requestContext: platformRequestContext(req, "platform-backup-dr"),
      reason: "Controlled PC replacement/disaster recovery identity transfer",
    });
    res.status(200).json({ backup: manifest, restored: true, identityTransferred: true });
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
