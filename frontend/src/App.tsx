import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { FeaturePlaceholderPage } from "./pages/FeaturePlaceholderPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ShellLandingPage } from "./pages/ShellLandingPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ShellLandingPage />} />
        <Route
          path="dashboard"
          element={<FeaturePlaceholderPage feature="dashboard" />}
        />
        <Route
          path="monitored-areas"
          element={<FeaturePlaceholderPage feature="monitoredAreas" />}
        />
        <Route
          path="alarms"
          element={<FeaturePlaceholderPage feature="alarms" />}
        />
        <Route
          path="devices"
          element={<FeaturePlaceholderPage feature="devices" />}
        />
        <Route
          path="configuration"
          element={<FeaturePlaceholderPage feature="configuration" />}
        />
        <Route path="foundation" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
