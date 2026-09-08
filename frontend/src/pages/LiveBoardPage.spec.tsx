import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardRoomStatuses } from "../dashboard/queries";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { englishResources } from "../localization/resources";
import { deriveLiveBoardStatus } from "../dashboard/liveBoardStatus";
import { LiveBoardPage } from "./LiveBoardPage";

vi.mock("../dashboard/queries", () => ({ useDashboardRoomStatuses: vi.fn() }));
const mockedStatuses = vi.mocked(useDashboardRoomStatuses);

const rooms = [
  {
    roomId: 1,
    roomName: "Cold Room Normal",
    siteId: 10,
    siteName: "Cairo Site",
    temperature: 4,
    temperatureUnit: "°C",
    temperatureRange: { min: 2, max: 8 },
    humidity: 50,
    temperatureStatus: "NORMAL",
    humidityStatus: "NORMAL",
    activeAlarms: 0,
    sensorCount: 3,
    online: true,
    lastUpdate: "2026-09-07T10:00:00.000Z",
  },
  {
    roomId: 2,
    roomName: "Cold Room Warning",
    siteId: 10,
    siteName: "Cairo Site",
    temperature: 7,
    humidity: 62,
    temperatureStatus: "WARNING",
    humidityStatus: "NORMAL",
    activeAlarms: 0,
    online: true,
    lastUpdate: "2026-09-07T10:01:00.000Z",
  },
  {
    roomId: 3,
    roomName: "Cold Room Alarm",
    siteId: 20,
    siteName: "Giza Site",
    temperature: 11,
    humidity: 70,
    temperatureStatus: "CRITICAL",
    humidityStatus: "WARNING",
    activeAlarms: 2,
    online: true,
    lastUpdate: "2026-09-07T10:02:00.000Z",
  },
  {
    roomId: 4,
    roomName: "Cold Room Offline",
    siteId: 20,
    siteName: "Giza Site",
    temperature: null,
    humidity: null,
    temperatureStatus: "UNKNOWN",
    humidityStatus: "UNKNOWN",
    activeAlarms: 0,
    online: false,
    lastUpdate: null,
  },
] as const;

function renderBoard(language: "en" | "ar" = "en") {
  return render(
    <MemoryRouter>
      <LocalizationProvider language={language}>
        <LiveBoardPage />
      </LocalizationProvider>
    </MemoryRouter>,
  );
}

describe("LiveBoardPage", () => {
  beforeEach(() => {
    mockedStatuses.mockReturnValue({
      data: rooms,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardRoomStatuses>);
  });

  it("derives the authoritative display priority without inventing a second state model", () => {
    expect(rooms.map((room) => deriveLiveBoardStatus(room))).toEqual([
      "NORMAL",
      "WARNING",
      "ALARM",
      "OFFLINE",
    ]);
  });

  it("renders live summary counts and one accessible card per monitored area", () => {
    renderBoard();
    const summary = screen.getByRole("region", {
      name: englishResources.liveBoard.title,
    });
    for (const label of [
      englishResources.liveBoard.normal,
      englishResources.liveBoard.warning,
      englishResources.liveBoard.alarm,
      englishResources.liveBoard.offline,
    ]) {
      expect(within(summary).getByText(label)).toBeVisible();
    }
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByText("11 °C")).toBeVisible();
    expect(screen.getByText("2–8 °C")).toBeVisible();
    expect(screen.getByText("Sensors: 3")).toBeVisible();
    expect(
      screen.queryByText((_, element) =>
        Boolean(element?.textContent?.includes("2026-09-07T10:02:00.000Z")),
      ),
    ).not.toBeInTheDocument();
  });

  it("isolates localized timestamps from Arabic bidi reordering", () => {
    renderBoard("ar");

    const timestamps = document.querySelectorAll('bdi[dir="ltr"]');
    expect(timestamps.length).toBeGreaterThan(0);
    expect(
      Array.from(timestamps).some((timestamp) =>
        timestamp.textContent?.includes("T10:"),
      ),
    ).toBe(false);
  });

  it("shows trusted health percentages and filters operational exceptions", async () => {
    const user = userEvent.setup();
    renderBoard();

    expect(screen.getAllByText("25%")).toHaveLength(5);

    await user.click(
      screen.getByRole("switch", {
        name: englishResources.liveBoard.alarmFocus,
      }),
    );

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.queryByText("Cold Room Normal")).not.toBeInTheDocument();
    expect(screen.queryByText("Cold Room Offline")).not.toBeInTheDocument();
  });

  it("filters the board locally by search without changing the API contract", async () => {
    const user = userEvent.setup();
    renderBoard();
    await user.type(
      screen.getByRole("textbox", { name: englishResources.liveBoard.search }),
      "Warning",
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Cold Room Warning" }),
    ).toBeVisible();
  });

  it("shows recoverable loading and error states", () => {
    mockedStatuses.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardRoomStatuses>);
    const { unmount } = renderBoard();
    expect(screen.getByText(englishResources.liveBoard.loading)).toBeVisible();
    unmount();

    mockedStatuses.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardRoomStatuses>);
    renderBoard();
    expect(screen.getByText(englishResources.liveBoard.error)).toBeVisible();
  });
});
