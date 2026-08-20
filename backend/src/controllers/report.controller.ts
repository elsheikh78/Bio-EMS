import { Request, Response } from "express";
import {
  calibrationCsvFilename,
  renderCalibrationCsv,
} from "../modules/reporting/calibration-csv.renderer";
import {
  calibrationPdfFilename,
  renderCalibrationPdf,
} from "../modules/reporting/calibration-pdf.renderer";
import { CalibrationReportService } from "../modules/reporting/calibration-report.service";
import { reportCatalogue } from "../modules/reporting/report-catalogue";

const calibrationReportService = new CalibrationReportService();

export function getReportCatalogue(_req: Request, res: Response): void {
  res.json(reportCatalogue);
}

export function previewReport(req: Request, res: Response): void {
  res.json(calibrationReportService.preview(req.body));
}

export async function exportReport(req: Request, res: Response): Promise<void> {
  const result = calibrationReportService.preview(req.body);

  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.body.format === "PDF") {
    const filename = calibrationPdfFilename(result);
    const pdf = await renderCalibrationPdf(result, req.user!.username);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);

    return;
  }

  const filename = calibrationCsvFilename(result);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(renderCalibrationCsv(result, req.user!.username));
}
