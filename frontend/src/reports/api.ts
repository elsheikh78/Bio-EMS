import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  calibrationReportPreviewRequestSchema,
  calibrationReportPreviewResultSchema,
  reportCatalogueSchema,
  type CalibrationReportPreviewRequest,
  type CalibrationReportExportRequest,
} from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export function createReportsApi(protectedRequest: ProtectedRequest) {
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
      const { format, ...previewInput } = input;

      const body = {
        ...calibrationReportPreviewRequestSchema.parse(previewInput),
        format,
      };

      const response = await protectedRequest<Response>("/reports/exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/csv",
        },
        body: JSON.stringify(body),
        responseMode: "response",
      });

      const disposition = response.headers.get("Content-Disposition") ?? "";

      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ??
        "bio-ems_calibration-history.csv";

      return {
        blob: await response.blob(),
        filename,
      };
    },
  };
}
