import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  calibrationReportPreviewRequestSchema,
  calibrationReportPreviewResultSchema,
  reportCatalogueSchema,
  type CalibrationReportExportRequest,
  type CalibrationReportPreviewRequest,
  temperaturePerformancePreviewRequestSchema,
  temperaturePerformancePreviewResultSchema,
  type TemperaturePerformanceExportRequest,
  type TemperaturePerformancePreviewRequest,
  operationalReportPreviewRequestSchema,
  operationalReportPreviewResultSchema,
  type OperationalReportExportRequest,
  type OperationalReportPreviewRequest,
} from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export function createReportsApi(protectedRequest: ProtectedRequest) {
  async function exportCalibration(
    input: CalibrationReportExportRequest,
    accept: "text/csv" | "application/pdf",
    fallbackFilename: string,
  ) {
    const { format, ...previewInput } = input;

    const body = {
      ...calibrationReportPreviewRequestSchema.parse(previewInput),
      format,
    };

    const response = await protectedRequest<Response>("/reports/exports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: accept,
      },
      body: JSON.stringify(body),
      responseMode: "response",
    });

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename =
      disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackFilename;

    return {
      blob: await response.blob(),
      filename,
    };
  }

  async function exportTemperature(
    input: TemperaturePerformanceExportRequest,
    accept: "text/csv" | "application/pdf",
    fallbackFilename: string,
  ) {
    const { format, ...previewInput } = input;
    const body = {
      ...temperaturePerformancePreviewRequestSchema.parse(previewInput),
      format,
    };
    const response = await protectedRequest<Response>("/reports/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: accept },
      body: JSON.stringify(body),
      responseMode: "response",
    });
    const disposition = response.headers.get("Content-Disposition") ?? "";
    return {
      blob: await response.blob(),
      filename:
        disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackFilename,
    };
  }

  return {
    async getCatalogue() {
      return reportCatalogueSchema.parse(
        await protectedRequest<unknown>("/reports/catalogue"),
      );
    },

    async previewCalibration(input: CalibrationReportPreviewRequest) {
      const body = calibrationReportPreviewRequestSchema.parse(input);

      return calibrationReportPreviewResultSchema.parse(
        await protectedRequest<unknown>("/reports/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    },

    async exportCalibrationCsv(input: CalibrationReportExportRequest) {
      return exportCalibration(
        { ...input, format: "CSV" },
        "text/csv",
        "bio-ems_calibration-history.csv",
      );
    },

    async exportCalibrationPdf(input: CalibrationReportExportRequest) {
      return exportCalibration(
        { ...input, format: "PDF" },
        "application/pdf",
        "bio-ems_calibration-history.pdf",
      );
    },

    async previewTemperature(input: TemperaturePerformancePreviewRequest) {
      const body = temperaturePerformancePreviewRequestSchema.parse(input);
      return temperaturePerformancePreviewResultSchema.parse(
        await protectedRequest<unknown>("/reports/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    },

    async exportTemperatureCsv(input: TemperaturePerformanceExportRequest) {
      return exportTemperature(
        { ...input, format: "CSV" },
        "text/csv",
        "bio-ems_temperature-performance.csv",
      );
    },

    async exportTemperaturePdf(input: TemperaturePerformanceExportRequest) {
      return exportTemperature(
        { ...input, format: "PDF" },
        "application/pdf",
        "bio-ems_temperature-performance.pdf",
      );
    },

    async previewOperational(input: OperationalReportPreviewRequest) {
      const body = operationalReportPreviewRequestSchema.parse(input);
      return operationalReportPreviewResultSchema.parse(
        await protectedRequest<unknown>("/reports/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    },

    async exportOperational(input: OperationalReportExportRequest) {
      const body = {
        ...operationalReportPreviewRequestSchema.parse(input),
        format: input.format,
      };
      const response = await protectedRequest<Response>("/reports/exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: input.format === "PDF" ? "application/pdf" : "text/csv",
        },
        body: JSON.stringify(body),
        responseMode: "response",
      });
      const disposition = response.headers.get("Content-Disposition") ?? "";
      return {
        blob: await response.blob(),
        filename:
          disposition.match(/filename="([^"]+)"/)?.[1] ??
          `bio-ems_${input.reportType.toLowerCase()}.${input.format.toLowerCase()}`,
      };
    },
  };
}
