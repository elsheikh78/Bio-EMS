import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useDashboardRoomStatuses,
  useDashboardSummary,
} from "../dashboard/queries";
import { LocalizationContext } from "../localization/context";
import { englishResources } from "../localization/resources";
import { DashboardPage } from "./DashboardPage";

vi.mock("../dashboard/queries", () => ({
  useDashboardSummary: vi.fn(),
  useDashboardRoomStatuses: vi.fn(),
}));

const mockedUseDashboardSummary = vi.mocked(useDashboardSummary);

const mockedUseDashboardRoomStatuses = vi.mocked(useDashboardRoomStatuses);

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

function mockSummarySuccess() {
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
}

function mockRoomsPending() {
  mockedUseDashboardRoomStatuses.mockReturnValue({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDashboardRoomStatuses>);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummarySuccess();
    mockRoomsPending();
  });

  it("renders an accessible dashboard summary loading state", () => {
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

    expect(
      screen.getByText(englishResources.dashboard.loading),
    ).toBeInTheDocument();
  });

  it("renders all summary KPI values", () => {
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

  it("renders a safe summary error state and retries on request", () => {
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

  it("renders an accessible monitored-area loading state", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: englishResources.dashboard.rooms.title,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.rooms.loading),
    ).toBeInTheDocument();
  });

  it("renders monitored-area operational status", () => {
    mockedUseDashboardRoomStatuses.mockReturnValue({
      data: [
        {
          roomId: 1,
          roomName: "Cold Room 1",
          siteId: 10,
          siteName: "Main Pharmaceutical Site",
          temperature: 4.2,
          humidity: 56,
          temperatureStatus: "NORMAL",
          humidityStatus: "WARNING",
          activeAlarms: 1,
          online: true,
          lastUpdate: "2026-08-12T17:30:00.000Z",
        },
        {
          roomId: 2,
          roomName: "Cold Room 2",
          siteId: 10,
          siteName: "Main Pharmaceutical Site",
          temperature: null,
          humidity: null,
          temperatureStatus: "UNKNOWN",
          humidityStatus: "CRITICAL",
          activeAlarms: 2,
          online: false,
          lastUpdate: null,
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardRoomStatuses>);

    renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: "Cold Room 1",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Cold Room 2",
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText("Main Pharmaceutical Site")).toHaveLength(2);

    expect(screen.getByText("4.2 °C")).toBeInTheDocument();
    expect(screen.getByText("56 %")).toBeInTheDocument();

    expect(
      screen.getAllByText(englishResources.dashboard.rooms.unavailable).length,
    ).toBeGreaterThanOrEqual(2);

    expect(
      screen.getByText(englishResources.dashboard.rooms.status.NORMAL),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.rooms.status.WARNING),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.rooms.status.CRITICAL),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.rooms.status.UNKNOWN),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.rooms.online),
    ).toBeInTheDocument();

    expect(
      screen.getByText(englishResources.dashboard.rooms.offline),
    ).toBeInTheDocument();

    expect(
      screen.getByText((_, element) => {
        const text = element?.textContent ?? "";

        return (
          element?.tagName.toLowerCase() === "span" &&
          text.includes(englishResources.dashboard.rooms.lastUpdate) &&
          text.includes("2026-08-12T17:30:00.000Z")
        );
      }),
    ).toBeInTheDocument();
  });

  it("renders the monitored-area empty state", () => {
    mockedUseDashboardRoomStatuses.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardRoomStatuses>);

    renderDashboard();

    expect(
      screen.getByText(englishResources.dashboard.rooms.empty),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        level: 3,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders a safe monitored-area error state and retries on request", () => {
    const refetch = vi.fn();

    mockedUseDashboardRoomStatuses.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useDashboardRoomStatuses>);

    renderDashboard();

    expect(
      screen.getByText(englishResources.dashboard.rooms.error),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: englishResources.dashboard.retry,
      }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
