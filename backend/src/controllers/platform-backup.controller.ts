import { Request, Response } from "express";
import {
  createCompletePlatformBackup,
  listPlatformBackups,
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
