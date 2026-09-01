import type { PlatformAuthenticationStatus } from "../platform-auth/context";

export type PlatformRouteDecision = "allow" | "login" | "loading" | "not-found";

export function getPlatformRouteDecision(
  status: PlatformAuthenticationStatus,
): PlatformRouteDecision {
  if (status === "authenticated") return "allow";
  if (status === "unauthenticated") return "login";
  if (status === "bootstrapping") return "loading";
  return "not-found";
}
