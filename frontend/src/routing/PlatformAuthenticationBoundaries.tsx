import { Box, CircularProgress } from "@mui/material";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { NotFoundPage } from "../pages/NotFoundPage";
import {
  usePlatformAuthentication,
  type PlatformAuthenticationStatus,
} from "../platform-auth/PlatformAuthenticationProvider";

export type PlatformRouteDecision =
  | "allow"
  | "login"
  | "loading"
  | "not-found";

export function getPlatformRouteDecision(
  status: PlatformAuthenticationStatus,
): PlatformRouteDecision {
  if (status === "authenticated") return "allow";
  if (status === "unauthenticated") return "login";
  if (status === "bootstrapping") return "loading";
  return "not-found";
}

export function PlatformAuthenticationBoundary() {
  const { status } = usePlatformAuthentication();
  const decision = getPlatformRouteDecision(status);

  if (decision === "loading") {
    return (
      <Box
        component="main"
        sx={{ display: "grid", minHeight: "100vh", placeItems: "center" }}
      >
        <CircularProgress aria-label="Checking owner session" />
      </Box>
    );
  }
  if (decision === "login") {
    return <Navigate to="/system-owner/login" replace />;
  }
  if (decision === "not-found") return <NotFoundPage />;
  return <Outlet />;
}

export function PlatformLoginBoundary({ children }: { children: ReactNode }) {
  const { status } = usePlatformAuthentication();
  if (status === "authenticated") {
    return <Navigate to="/system-owner" replace />;
  }
  if (status === "bootstrapping") return null;
  return children;
}
