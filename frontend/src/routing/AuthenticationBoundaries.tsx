import { Box, CircularProgress, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
import { NotAuthorizedPage } from "../pages/NotAuthorizedPage";
import { RestorationErrorPage } from "../pages/RestorationErrorPage";
import { routePolicies, type AuthorizedRoutePath } from "./routePolicy";
import { hasPermission } from "../authorization/permissions";

export function AuthenticationBoundary() {
  const authentication = useAuthentication();
  const location = useLocation();

  if (authentication.status === "bootstrapping") return <SessionLoading />;
  if (authentication.status === "restoration-error") {
    return <RestorationErrorPage />;
  }
  if (authentication.status === "unauthenticated") {
    return (
      <Navigate to="/login" replace state={{ returnTo: location.pathname }} />
    );
  }
  return <Outlet />;
}

export function LoginBoundary({ children }: PropsWithChildren) {
  const authentication = useAuthentication();

  if (authentication.status === "bootstrapping") return <SessionLoading />;
  if (authentication.status === "restoration-error") {
    return <RestorationErrorPage />;
  }
  if (authentication.status === "authenticated") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function PermissionBoundary({
  children,
  path,
}: PropsWithChildren<{ path: AuthorizedRoutePath }>) {
  const { user } = useAuthentication();

  if (!user || !hasPermission(user.role, routePolicies[path])) {
    return <NotAuthorizedPage />;
  }
  return children;
}

function SessionLoading() {
  const { resources } = useLocalization();
  return (
    <Box
      aria-live="polite"
      component="main"
      sx={{ display: "grid", minHeight: "100vh", placeItems: "center" }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress aria-hidden />
        <Typography sx={{ mt: 2 }}>
          {resources.authentication.checkingSession}
        </Typography>
      </Box>
    </Box>
  );
}
