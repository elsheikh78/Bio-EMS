import { Request, Response } from "express";
import { reportCatalogue } from "../modules/reporting/report-catalogue";

export function getReportCatalogue(_req: Request, res: Response): void {
  res.json(reportCatalogue);
}
