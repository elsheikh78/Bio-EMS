import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createReportsApi } from "./api";
import type { CalibrationReportPreviewRequest } from "./contracts";

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
