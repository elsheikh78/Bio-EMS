import { Request, Response } from "express";
import { reportCatalogue } from "../modules/reporting/report-catalogue";
import { CalibrationReportService } from "../modules/reporting/calibration-report.service";

const calibrationReportService = new CalibrationReportService();

export function getReportCatalogue(_req: Request, res: Response): void {
  res.json(reportCatalogue);
}

export function previewReport(req: Request, res: Response): void {
  res.json(calibrationReportService.preview(req.body));
}
