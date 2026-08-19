import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createReportsApi } from "./api";

export const reportQueryKeys = { catalogue: ["reports", "catalogue"] as const };

export function useReportCatalogue() {
  const { protectedRequest } = useAuthentication();
  const api = createReportsApi(protectedRequest);
  return useQuery({
    queryKey: reportQueryKeys.catalogue,
    queryFn: () => api.getCatalogue(),
  });
}
