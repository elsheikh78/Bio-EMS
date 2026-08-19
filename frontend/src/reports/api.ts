import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import {
  calibrationReportPreviewRequestSchema,
  calibrationReportPreviewResultSchema,
  reportCatalogueSchema,
  type CalibrationReportPreviewRequest,
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
  };
}
