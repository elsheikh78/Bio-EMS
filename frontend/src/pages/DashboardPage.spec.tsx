import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardSummary } from "../dashboard/queries";
import { LocalizationContext } from "../localization/context";
import { englishResources } from "../localization/resources";
import { DashboardPage } from "./DashboardPage";

vi.mock("../dashboard/queries", () => ({
  useDashboardSummary: vi.fn(),
}));

const mockedUseDashboardSummary = vi.mocked(useDashboardSummary);

function renderDashboard() {
  return render(
    <LocalizationContext.Provider
      value={{
        language: "en",
        direction: "ltr",
        resources: englishResources,
      }}
    >
      <DashboardPage />
    </LocalizationContext.Provider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an accessible loading state", () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardSummary>);

    renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: englishResources.dashboard.title,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("status")).toHaveTextContent(
      englishResources.dashboard.loading,
    );
  });

  it("renders all summary KPI values", () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: {
        totalSites: 2,
        totalRooms: 6,
        totalDevices: 4,
        totalSensors: 18,
        activeAlarms: 3,
        offlineDevices: 1,
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardSummary>);

    renderDashboard();

    expect(
      screen.getByText(englishResources.dashboard.summary.totalSites),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.summary.totalRooms),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.summary.totalDevices),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.summary.totalSensors),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.summary.activeAlarms),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.summary.offlineDevices),
    ).toBeInTheDocument();

    for (const value of ["2", "6", "4", "18", "3", "1"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it("renders a safe error state and retries on request", () => {
    const refetch = vi.fn();

    mockedUseDashboardSummary.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useDashboardSummary>);

    renderDashboard();

    expect(
      screen.getByText(englishResources.dashboard.error),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: englishResources.dashboard.retry,
      }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
