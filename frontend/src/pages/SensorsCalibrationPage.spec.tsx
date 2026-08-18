import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sensor } from "../monitoredAreas/contracts";
import { useAuthentication } from "../auth/useAuthentication";
import {
  useCalibrationHistory,
  useCreateCalibrationRecord,
  useSensors,
} from "../monitoredAreas/queries";
import { SensorsCalibrationPage } from "./SensorsCalibrationPage";

vi.mock("../auth/useAuthentication", () => ({ useAuthentication: vi.fn() }));
vi.mock("../monitoredAreas/queries", () => ({
  useSensors: vi.fn(),
  useCalibrationHistory: vi.fn(),
  useCreateCalibrationRecord: vi.fn(),
}));

const mockedUseSensors = vi.mocked(useSensors);
const mockedUseAuthentication = vi.mocked(useAuthentication);
const mockedUseCalibrationHistory = vi.mocked(useCalibrationHistory);
const mockedUseCreateCalibrationRecord = vi.mocked(useCreateCalibrationRecord);
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
  beforeEach(() => {
    vi.resetAllMocks();
    mockedUseAuthentication.mockReturnValue({
      user: { id: 1, username: "admin", role: "ADMIN" },
    } as ReturnType<typeof useAuthentication>);
    mockedUseCalibrationHistory.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCalibrationHistory>);
    mockedUseCreateCalibrationRecord.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useCreateCalibrationRecord>);
  });

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
    expect(screen.getAllByRole("button", { name: "Record" })).toHaveLength(2);
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
      screen.getByText(/No sensors match the current filters/i),
    ).toBeInTheDocument();
  });

  it("filters the register and exposes real calibration history", () => {
    mockedUseSensors.mockReturnValue({
      data: [
        baseSensor,
        {
          ...baseSensor,
          id: 2,
          uuid: "sensor-2",
          code: "HUM-01",
          name: "Humidity",
          sensor_type: "humidity",
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSensors>);
    mockedUseCalibrationHistory.mockReturnValue({
      data: [
        {
          id: 9,
          sensor_id: 1,
          sensor_uuid: "sensor-1",
          result: "PASS",
          performed_at: "2026-08-18T09:00:00Z",
          due_at: "2027-08-18T09:00:00Z",
          offset: 0.1,
          certificate_reference: "CAL-009",
          notes: null,
          performed_by_user_id: 1,
          performed_by_username: "admin",
          created_at: "2026-08-18T09:00:00Z",
        },
      ],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCalibrationHistory>);

    render(<SensorsCalibrationPage />);
    fireEvent.change(screen.getByLabelText("Search sensors"), {
      target: { value: "humidity" },
    });
    expect(screen.getByText("Humidity")).toBeInTheDocument();
    expect(screen.queryByText("Cold room temperature")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("CAL-009")).toBeInTheDocument();
  });
});
