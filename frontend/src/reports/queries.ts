import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createReportsApi } from "./api";
import type {
  CalibrationReportExportRequest,
  CalibrationReportPreviewRequest,
  TemperaturePerformanceExportRequest,
  TemperaturePerformancePreviewRequest,
  OperationalReportExportRequest,
  OperationalReportPreviewRequest,
} from "./contracts";

export const reportQueryKeys = { catalogue: ["reports", "catalogue"] as const };

export function useReportCatalogue() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useQuery({
    queryKey: reportQueryKeys.catalogue,
    queryFn: () => api.getCatalogue(),
  });
}

export function useCalibrationReportPreview() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: CalibrationReportPreviewRequest) =>
      api.previewCalibration(input),
  });
}

export function useCalibrationReportCsvExport() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: CalibrationReportExportRequest) =>
      api.exportCalibrationCsv(input),
  });
}

export function useCalibrationReportPdfExport() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: CalibrationReportExportRequest) =>
      api.exportCalibrationPdf(input),
  });
}

export function useTemperaturePerformancePreview() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: TemperaturePerformancePreviewRequest) =>
      api.previewTemperature(input),
  });
}

export function useTemperaturePerformanceCsvExport() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: TemperaturePerformanceExportRequest) =>
      api.exportTemperatureCsv(input),
  });
}

export function useTemperaturePerformancePdfExport() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: TemperaturePerformanceExportRequest) =>
      api.exportTemperaturePdf(input),
  });
}

export function useOperationalReportPreview() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: OperationalReportPreviewRequest) =>
      api.previewOperational(input),
  });
}

export function useOperationalReportExport() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useMutation({
    mutationFn: (input: OperationalReportExportRequest) =>
      api.exportOperational(input),
  });
}
