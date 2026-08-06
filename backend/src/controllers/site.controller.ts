import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { createSite, getSites } from "../services/site.service";

export const createSiteController = asyncHandler(async (req: Request, res: Response) => {
  const siteId = createSite(req.body);

  res.status(201).json({
    success: true,
    id: siteId,
  });
});

export const getSitesController = asyncHandler(async (req: Request, res: Response) => {
  res.json(getSites());
});
