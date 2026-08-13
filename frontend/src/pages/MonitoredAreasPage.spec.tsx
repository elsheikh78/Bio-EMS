import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import type { Room, Sensor, Site } from "../monitoredAreas/contracts";
import { useRooms, useSensors, useSites } from "../monitoredAreas/queries";
import { MonitoredAreasPage } from "./MonitoredAreasPage";

vi.mock("../monitoredAreas/queries", () => ({
  useSites: vi.fn(),
  useRooms: vi.fn(),
  useSensors: vi.fn(),
}));

const mockedUseSites = vi.mocked(useSites);
const mockedUseRooms = vi.mocked(useRooms);
const mockedUseSensors = vi.mocked(useSensors);

const site: Site = {
  id: 1,
  code: "CAIRO",
  name: "Cairo Site",
  location: "Cairo",
  timezone: "Africa/Cairo",
  active: 1,
};

const room: Room = {
  id: 10,
  uuid: "room-10",
  site_id: 1,
  code: "CR-01",
  name: "Cold Room 01",
  description: "Primary medicine cold room",
  active: 1,
};

const sensor: Sensor = {
  id: 100,
  uuid: "sensor-100",
  room_id: 10,
  device_id: 20,
  channel: 0,
  code: "TEMP-01",
  name: "Temperature Sensor 01",
  sensor_type: "temperature",
  unit: "°C",
  min_value: 2,
  max_value: 8,
  warning_low: 2.5,
  alarm_low: 2,
  warning_high: 7.5,
  alarm_high: 8,
  enabled: 1,
};

function renderPage() {
  return render(
    <LocalizationProvider>
      <MonitoredAreasPage />
    </LocalizationProvider>,
  );
}

function setSuccessfulQueries({
  sites = [site],
  rooms = [room],
  sensors = [sensor],
}: {
  sites?: Site[];
  rooms?: Room[];
  sensors?: Sensor[];
} = {}) {
  mockedUseSites.mockReturnValue({
    data: sites,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useSites>);

  mockedUseRooms.mockReturnValue({
    data: rooms,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useRooms>);

  mockedUseSensors.mockReturnValue({
    data: sensors,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useSensors>);
}

describe("MonitoredAreasPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders an accessible loading state", () => {
    mockedUseSites.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useSites>);

    mockedUseRooms.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useRooms>);

    mockedUseSensors.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSensors>);

    renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Monitored Areas",
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading monitored areas",
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders an error state when a resource query fails", () => {
    mockedUseSites.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useSites>);

    mockedUseRooms.mockReturnValue({
      data: [] as Room[],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useRooms>);

    mockedUseSensors.mockReturnValue({
      data: [] as Sensor[],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSensors>);

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load monitored areas configuration.",
    );
  });

  it("renders the empty Sites state", () => {
    setSuccessfulQueries({
      sites: [],
      rooms: [],
      sensors: [],
    });

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No Sites are currently configured.",
    );
  });

  it("renders the Site to Monitored Area hierarchy", () => {
    setSuccessfulQueries();

    renderPage();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Cairo Site",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("CAIRO")).toBeInTheDocument();
    expect(screen.getByText("Cairo")).toBeInTheDocument();
    expect(screen.getByText("Active Site")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Cold Room 01",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("CR-01")).toBeInTheDocument();
    expect(screen.getByText("Primary medicine cold room")).toBeInTheDocument();
    expect(screen.getByText("Active Area")).toBeInTheDocument();
  });

  it("renders Sensors under their Monitored Area", () => {
    setSuccessfulQueries();

    renderPage();

    expect(screen.getByText("Temperature Sensor 01")).toBeInTheDocument();
    expect(screen.getByText("TEMP-01")).toBeInTheDocument();
    expect(screen.getByText("temperature")).toBeInTheDocument();
    expect(screen.getByText("°C")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();

    expect(screen.getByText("Sensor Type")).toBeInTheDocument();
    expect(screen.getByText("Unit")).toBeInTheDocument();
    expect(screen.getByText("Channel")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("does not place a Room under an unrelated Site", () => {
    const unrelatedRoom: Room = {
      ...room,
      id: 11,
      uuid: "room-11",
      site_id: 2,
      code: "OTHER-ROOM",
      name: "Other Site Room",
    };

    setSuccessfulQueries({
      rooms: [unrelatedRoom],
      sensors: [],
    });

    renderPage();

    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Other Site Room",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No Monitored Areas are configured for this Site.",
    );
  });

  it("renders an empty Sensors state for a configured Monitored Area", () => {
    setSuccessfulQueries({
      sensors: [],
    });

    renderPage();

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Cold Room 01",
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No Sensors are configured for this Monitored Area.",
    );
  });

  it("does not place a Sensor under an unrelated Monitored Area", () => {
    const unrelatedSensor: Sensor = {
      ...sensor,
      id: 101,
      uuid: "sensor-101",
      room_id: 999,
      code: "OTHER-SENSOR",
      name: "Other Room Sensor",
    };

    setSuccessfulQueries({
      sensors: [unrelatedSensor],
    });

    renderPage();

    expect(screen.queryByText("Other Room Sensor")).not.toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No Sensors are configured for this Monitored Area.",
    );
  });

  it("renders inactive and disabled configuration states", () => {
    setSuccessfulQueries({
      sites: [
        {
          ...site,
          active: 0,
        },
      ],
      rooms: [
        {
          ...room,
          active: 0,
        },
      ],
      sensors: [
        {
          ...sensor,
          enabled: 0,
        },
      ],
    });

    renderPage();

    expect(screen.getByText("Inactive Site")).toBeInTheDocument();
    expect(screen.getByText("Inactive Area")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });
});
