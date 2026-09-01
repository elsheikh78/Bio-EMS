import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { PlatformOperationsRepository } from "../modules/platform-operations/platform-operations.repository";

const repository = new PlatformOperationsRepository();
const actor = (req: Request) => `${req.platformPrincipal!.username}#${req.platformPrincipal!.id}`;

export const platformOperationsOverview = asyncHandler(async (_req: Request, res: Response) =>
  res.json(repository.overview())
);
export const createPlatformCustomer = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json({ success: true, id: repository.createCustomer(req.body, actor(req)) })
);
export const createPlatformLicense = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json({ success: true, id: repository.createLicense(req.body, actor(req)) })
);
export const createPlatformMaintenance = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json({ success: true, id: repository.createMaintenance(req.body, actor(req)) })
);
