import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { LoginPage } from "./pages/LoginPage";
import { MonitoredAreasPage } from "./pages/MonitoredAreasPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ShellLandingPage } from "./pages/ShellLandingPage";
import { SensorsCalibrationPage } from "./pages/SensorsCalibrationPage";
import { ReportsCenterPage } from "./pages/ReportsCenterPage";
import { AdministrationPage } from "./pages/AdministrationPage";
import { AlarmsPage } from "./pages/AlarmsPage";
import { DevicesPage } from "./pages/DevicesPage";
import { NotificationDeliveriesPage } from "./pages/NotificationDeliveriesPage";
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
                <DashboardPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="monitored-areas"
            element={
              <PermissionBoundary path="/monitored-areas">
                <MonitoredAreasPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="alarms"
            element={
              <PermissionBoundary path="/alarms">
                <AlarmsPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="devices"
            element={
              <PermissionBoundary path="/devices">
                <DevicesPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="notification-deliveries"
            element={
              <PermissionBoundary path="/notification-deliveries">
                <NotificationDeliveriesPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="sensors-calibration"
            element={
              <PermissionBoundary path="/sensors-calibration">
                <SensorsCalibrationPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="reports"
            element={
              <PermissionBoundary path="/reports">
                <ReportsCenterPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="configuration"
            element={
              <PermissionBoundary path="/configuration">
                <ConfigurationPage />
              </PermissionBoundary>
            }
          />

          <Route
            path="users"
            element={
              <PermissionBoundary path="/users">
                <AdministrationPage />
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
