import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import { reportCatalogueSchema } from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];

export function createReportsApi(protectedRequest: ProtectedRequest) {
  return {
    async getCatalogue() {
      return reportCatalogueSchema.parse(
        await protectedRequest<unknown>("/reports/catalogue"),
      );
    },
  };
}
