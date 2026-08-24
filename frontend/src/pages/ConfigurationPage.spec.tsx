import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useUpdateSensorAlarmDelay,
  useUpdateSensorThresholds,
} from "../configuration/queries";
import { useSensors } from "../monitoredAreas/queries";
import { ConfigurationPage } from "./ConfigurationPage";

vi.mock("../monitoredAreas/queries", () => ({ useSensors: vi.fn() }));
vi.mock("../configuration/queries", () => ({
  useUpdateSensorThresholds: vi.fn(),
  useUpdateSensorAlarmDelay: vi.fn(),
}));
vi.mock("../configuration/NotificationRecipientsPanel", () => ({
  NotificationRecipientsPanel: () => <div>Recipient panel</div>,
}));

const mockedSensors = vi.mocked(useSensors);
const mockedThresholds = vi.mocked(useUpdateSensorThresholds);
const mockedDelays = vi.mocked(useUpdateSensorAlarmDelay);
const sensor = {
  id: 1,
  uuid: "sensor-1",
  room_id: 1,
  device_id: 1,
  channel: 0,
  code: "TEMP-01",
  name: "Cold room temperature",
  sensor_type: "temperature",
  unit: "°C",
  alarm_low: 0,
  warning_low: 1,
  warning_high: 7,
  alarm_high: 8,
  warning_delay_seconds: 30,
  critical_delay_seconds: 10,
};

describe("ConfigurationPage", () => {
  const updateThresholds = vi.fn();
  const updateDelays = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockedSensors.mockReturnValue({
      data: [sensor],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSensors>);
    mockedThresholds.mockReturnValue({
      mutateAsync: updateThresholds,
      isPending: false,
      isError: false,
      isSuccess: false,
    } as unknown as ReturnType<typeof useUpdateSensorThresholds>);
    mockedDelays.mockReturnValue({
      mutateAsync: updateDelays,
      isPending: false,
      isError: false,
      isSuccess: false,
    } as unknown as ReturnType<typeof useUpdateSensorAlarmDelay>);
  });

  it("renders and filters the sensor configuration register", () => {
    render(<ConfigurationPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sensor thresholds & alarm delays",
    );
    fireEvent.change(screen.getByLabelText("Search sensors"), {
      target: { value: "missing" },
    });
    expect(screen.getByText(/No sensors match/i)).toBeInTheDocument();
  });

  it("validates order before sending either controlled mutation", () => {
    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /Edit Cold room/i }));
    fireEvent.change(screen.getByLabelText(/Alarm Low/), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save configuration" }));
    expect(screen.getByText("Threshold order is invalid.")).toBeInTheDocument();
    expect(updateThresholds).not.toHaveBeenCalled();
    expect(updateDelays).not.toHaveBeenCalled();
  });

  it("persists thresholds before alarm delays with typed values", async () => {
    updateThresholds.mockResolvedValue(sensor);
    updateDelays.mockResolvedValue(sensor);
    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /Edit Cold room/i }));
    fireEvent.change(screen.getByLabelText(/Warning delay \(seconds\)/), {
      target: { value: "45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save configuration" }));
    await waitFor(() =>
      expect(updateThresholds).toHaveBeenCalledWith({
        alarm_low: 0,
        warning_low: 1,
        warning_high: 7,
        alarm_high: 8,
      }),
    );
    expect(updateDelays).toHaveBeenCalledWith({
      warning_delay_seconds: 45,
      critical_delay_seconds: 10,
    });
    expect(updateThresholds.mock.invocationCallOrder[0]).toBeLessThan(
      updateDelays.mock.invocationCallOrder[0],
    );
  });

  it("shows loading and recoverable error states", () => {
    mockedSensors.mockReturnValue({ isPending: true } as ReturnType<
      typeof useSensors
    >);
    const { rerender } = render(<ConfigurationPage />);
    expect(screen.getByLabelText("Loading sensors")).toBeInTheDocument();
    const refetch = vi.fn();
    mockedSensors.mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useSensors>);
    rerender(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
