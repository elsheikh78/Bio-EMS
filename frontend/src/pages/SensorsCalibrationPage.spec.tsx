import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sensor } from "../monitoredAreas/contracts";
import { useSensors } from "../monitoredAreas/queries";
import { SensorsCalibrationPage } from "./SensorsCalibrationPage";

vi.mock("../monitoredAreas/queries", () => ({ useSensors: vi.fn() }));

const mockedUseSensors = vi.mocked(useSensors);
const baseSensor: Sensor = {
  id: 1,
  uuid: "sensor-1",
  room_id: 1,
  device_id: 1,
  channel: 0,
  code: "TEMP-01",
  name: "Cold room temperature",
  sensor_type: "temperature",
  unit: "°C",
  min_value: -5,
  warning_low: 1,
  alarm_low: 0,
  warning_high: 7,
  alarm_high: 8,
  max_value: 10,
  enabled: 1,
};

describe("SensorsCalibrationPage", () => {
  beforeEach(() => vi.resetAllMocks());

  it("summarizes and renders real calibration evidence", () => {
    mockedUseSensors.mockReturnValue({
      data: [
        {
          ...baseSensor,
          calibration_status: "VALID",
          hardware_model: "PT100-A",
          calibration_offset: 0.2,
          certificate_reference: "CERT-2026-01",
        },
        {
          ...baseSensor,
          id: 2,
          uuid: "sensor-2",
          code: "TEMP-02",
          name: "Freezer temperature",
          calibration_status: "EXPIRED",
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSensors>);

    render(<SensorsCalibrationPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sensors & Calibration",
    );
    expect(screen.getByText("PT100-A")).toBeInTheDocument();
    expect(screen.getByText("CERT-2026-01")).toBeInTheDocument();
    expect(screen.getByText("0.2 °C")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
  });

  it("shows loading, error retry, and empty states", () => {
    mockedUseSensors.mockReturnValue({
      isPending: true,
      isError: false,
    } as ReturnType<typeof useSensors>);
    const { rerender } = render(<SensorsCalibrationPage />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    const refetch = vi.fn();
    mockedUseSensors.mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useSensors>);
    rerender(<SensorsCalibrationPage />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();

    mockedUseSensors.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSensors>);
    rerender(<SensorsCalibrationPage />);
    expect(
      screen.getByText(/No Sensors are currently configured/i),
    ).toBeInTheDocument();
  });
});
