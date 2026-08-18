import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OperationalOverview } from "./DashboardVisuals";

const labels = {
  title: "Operational overview",
  description: "Evidence-based status",
  deviceTitle: "Device connectivity",
  deviceDescription: "Current distribution",
  online: "Online",
  offline: "Offline",
  staleUnavailable: "Stale status is unavailable.",
  severityTitle: "Alarm severity",
  severityDescription: "Current severity distribution",
  critical: "Critical",
  warning: "Warning",
  info: "Information",
  total: "Total",
  noData: "No current records.",
  trendUnavailable: "Historical trends are unavailable.",
  partialData: "Some operational panels are unavailable.",
  panelUnavailable: "This panel is unavailable.",
};

describe("OperationalOverview", () => {
  it("renders accessible device and alarm distributions from current records", () => {
    render(
      <OperationalOverview
        summary={{
          totalSites: 2,
          totalRooms: 8,
          totalDevices: 5,
          totalSensors: 20,
          activeAlarms: 4,
          offlineDevices: 2,
        }}
        alarmStatistics={{
          active: 4,
          acknowledged: 1,
          recovered: 7,
          critical: 2,
          warning: 3,
          info: 1,
        }}
        labels={labels}
      />,
    );

    const devicePanel = screen
      .getByRole("heading", { name: labels.deviceTitle })
      .closest<HTMLElement>(".MuiPaper-root");
    const severityPanel = screen
      .getByRole("heading", { name: labels.severityTitle })
      .closest<HTMLElement>(".MuiPaper-root");

    expect(devicePanel).not.toBeNull();
    expect(severityPanel).not.toBeNull();

    expect(within(devicePanel!).getByText(labels.online)).toBeInTheDocument();
    expect(within(devicePanel!).getByText("3")).toBeInTheDocument();
    expect(
      within(severityPanel!).getByText(labels.critical),
    ).toBeInTheDocument();
    expect(within(severityPanel!).getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/Stale status is unavailable/)).toBeInTheDocument();
    expect(
      screen.getByText(/Historical trends are unavailable/),
    ).toBeInTheDocument();
  });

  it("does not produce a negative Online count from inconsistent input", () => {
    render(
      <OperationalOverview
        summary={{
          totalSites: 0,
          totalRooms: 0,
          totalDevices: 1,
          totalSensors: 0,
          activeAlarms: 0,
          offlineDevices: 2,
        }}
        alarmStatistics={{
          active: 0,
          acknowledged: 0,
          recovered: 0,
          critical: 0,
          warning: 0,
          info: 0,
        }}
        labels={labels}
      />,
    );

    expect(screen.queryByText("-1")).not.toBeInTheDocument();
    expect(screen.getByText(labels.noData)).toBeInTheDocument();
  });

  it("keeps available evidence visible when one source fails", () => {
    render(
      <OperationalOverview
        summary={{
          totalSites: 1,
          totalRooms: 2,
          totalDevices: 3,
          totalSensors: 4,
          activeAlarms: 0,
          offlineDevices: 1,
        }}
        labels={labels}
      />,
    );

    expect(screen.getByText(labels.online)).toBeInTheDocument();
    expect(screen.getByText(labels.panelUnavailable)).toBeInTheDocument();
    expect(screen.getByText(labels.partialData)).toBeInTheDocument();
  });
});
