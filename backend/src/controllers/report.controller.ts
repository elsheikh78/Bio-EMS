import { Request, Response } from "express";
import { reportCatalogue } from "../modules/reporting/report-catalogue";
import { CalibrationReportService } from "../modules/reporting/calibration-report.service";
import {
  calibrationCsvFilename,
  renderCalibrationCsv,
} from "../modules/reporting/calibration-csv.renderer";

const calibrationReportService = new CalibrationReportService();

export function getReportCatalogue(_req: Request, res: Response): void {
  res.json(reportCatalogue);
}

export function previewReport(req: Request, res: Response): void {
  res.json(calibrationReportService.preview(req.body));
}

export function exportReport(req: Request, res: Response): void {
  const result = calibrationReportService.preview(req.body);
  const filename = calibrationCsvFilename(result);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(renderCalibrationCsv(result, req.user!.username));
}
