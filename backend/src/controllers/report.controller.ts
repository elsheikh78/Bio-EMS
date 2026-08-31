import { Request, Response } from "express";

import {
  calibrationCsvFilename,
  renderCalibrationCsv,
} from "../modules/reporting/calibration-csv.renderer";

import {
  calibrationPdfFilename,
  renderCalibrationPdf,
} from "../modules/reporting/calibration-pdf.renderer";

import {
  renderTemperaturePerformanceCsv,
  temperaturePerformanceCsvFilename,
} from "../modules/reporting/temperature-performance-csv.renderer";

import {
  renderTemperaturePerformancePdf,
  temperaturePerformancePdfFilename,
} from "../modules/reporting/temperature-performance-pdf.renderer";

import { CalibrationReportService } from "../modules/reporting/calibration-report.service";
import { TemperaturePerformanceReportService } from "../modules/reporting/temperature-performance-report.service";
import { reportCatalogue } from "../modules/reporting/report-catalogue";
import { OperationalReportService } from "../modules/reporting/operational-report.service";
import {
  operationalCsvFilename,
  renderOperationalCsv,
} from "../modules/reporting/operational-csv.renderer";
import {
  operationalPdfFilename,
  renderOperationalPdf,
} from "../modules/reporting/operational-pdf.renderer";

const calibrationReportService = new CalibrationReportService();

const temperaturePerformanceReportService = new TemperaturePerformanceReportService();
const operationalReportService = new OperationalReportService();

export function getReportCatalogue(_req: Request, res: Response): void {
  res.json(reportCatalogue);
}

export async function previewReport(req: Request, res: Response): Promise<void> {
  switch (req.body.reportType) {
    case "CALIBRATION-HISTORY":
      res.json(await calibrationReportService.preview(req.body));
      return;

    case "TEMP-PERFORMANCE":
      res.json(await temperaturePerformanceReportService.preview(req.body));
      return;

    case "ALARM-HISTORY":
    case "DEVICE-HEALTH":
    case "AUDIT-OPERATIONS":
      res.json(operationalReportService.preview(req.body));
      return;

    default:
      res.status(400).json({
        error: "UNSUPPORTED_REPORT_TYPE",
      });
  }
}

export async function exportReport(req: Request, res: Response): Promise<void> {
  res.setHeader("X-Content-Type-Options", "nosniff");

  switch (req.body.reportType) {
    case "CALIBRATION-HISTORY": {
      const result = await calibrationReportService.preview(req.body);

      if (req.body.format === "PDF") {
        const filename = calibrationPdfFilename(result);

        const pdf = await renderCalibrationPdf(result, req.user!.username);

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        res.send(pdf);

        return;
      }

      if (req.body.format === "CSV") {
        const filename = calibrationCsvFilename(result);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        res.send(renderCalibrationCsv(result, req.user!.username));

        return;
      }

      break;
    }

    case "TEMP-PERFORMANCE": {
      const result = await temperaturePerformanceReportService.preview(req.body);

      if (req.body.format === "PDF") {
        const filename = temperaturePerformancePdfFilename(result);

        const pdf = await renderTemperaturePerformancePdf(result, req.user!.username);

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        res.send(pdf);

        return;
      }

      if (req.body.format === "CSV") {
        const filename = temperaturePerformanceCsvFilename(result);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        res.send(renderTemperaturePerformanceCsv(result, req.user!.username));

        return;
      }

      break;
    }

    case "ALARM-HISTORY":
    case "DEVICE-HEALTH":
    case "AUDIT-OPERATIONS": {
      const result = operationalReportService.preview(req.body);
      if (req.body.format === "PDF") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${operationalPdfFilename(result)}"`
        );
        res.send(await renderOperationalPdf(result, req.user!.username));
        return;
      }
      if (req.body.format === "CSV") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${operationalCsvFilename(result)}"`
        );
        res.send(renderOperationalCsv(result, req.user!.username));
        return;
      }
      break;
    }

    default:
      res.status(400).json({
        error: "UNSUPPORTED_REPORT_TYPE",
      });

      return;
  }

  res.status(501).json({
    error: "REPORT_EXPORT_NOT_IMPLEMENTED",
  });
}
