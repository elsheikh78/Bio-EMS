import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { FeaturePlaceholderPage } from "./pages/FeaturePlaceholderPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ShellLandingPage } from "./pages/ShellLandingPage";
import { UsersPlaceholderPage } from "./pages/UsersPlaceholderPage";
import {
  AuthenticationBoundary,
  LoginBoundary,
  PermissionBoundary,
} from "./routing/AuthenticationBoundaries";

export function App() {
  return (
    <Routes>
      <Route
        path="login"
        element={
          <LoginBoundary>
            <LoginPage />
          </LoginBoundary>
        }
      />
      <Route element={<AuthenticationBoundary />}>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <PermissionBoundary path="/">
                <ShellLandingPage />
              </PermissionBoundary>
            }
          />
          <Route
            path="dashboard"
            element={
              <PermissionBoundary path="/dashboard">
                <FeaturePlaceholderPage feature="dashboard" />
              </PermissionBoundary>
            }
          />
          <Route
            path="monitored-areas"
            element={
              <PermissionBoundary path="/monitored-areas">
                <FeaturePlaceholderPage feature="monitoredAreas" />
              </PermissionBoundary>
            }
          />
          <Route
            path="alarms"
            element={
              <PermissionBoundary path="/alarms">
                <FeaturePlaceholderPage feature="alarms" />
              </PermissionBoundary>
            }
          />
          <Route
            path="devices"
            element={
              <PermissionBoundary path="/devices">
                <FeaturePlaceholderPage feature="devices" />
              </PermissionBoundary>
            }
          />
          <Route
            path="configuration"
            element={
              <PermissionBoundary path="/configuration">
                <FeaturePlaceholderPage feature="configuration" />
              </PermissionBoundary>
            }
          />
          <Route
            path="users"
            element={
              <PermissionBoundary path="/users">
                <UsersPlaceholderPage />
              </PermissionBoundary>
            }
          />
          <Route path="foundation" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
