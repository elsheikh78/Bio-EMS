import { Request, Response } from "express";
import { listPlatformBackups } from "../modules/platform-backup/platform-backup.service";

export async function listCustomerPlatformBackups(_req: Request, res: Response): Promise<void> {
  const backups = await listPlatformBackups();
  res.status(200).json({ backups });
}
