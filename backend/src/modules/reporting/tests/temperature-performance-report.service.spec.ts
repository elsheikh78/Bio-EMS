import { describe, expect, it, vi } from "vitest";
import { TemperaturePerformanceReportService } from "../temperature-performance-report.service";

const mockGetTemperaturePerformanceSummary = vi.fn();

vi.mock(
  "../../../../database/influx/queries/temperature-performance.query",
  () => ({
    getTemperaturePerformanceSummary:
      mockGetTemperaturePerformanceSummary,
  }),
);

describe("TemperaturePerformanceReportService", () => {
  const service = new TemperaturePerformanceReportService();

  const request = {
    reportType: "TEMP-PERFORMANCE",
    contractVersion: "1.0",
    sensorUuids: ["sensor-temp-001"],
    from: "2026-08-01T00:00:00Z",
    to: "2026-08-24T00:00:00Z",
    timeZone: "Africa/Cairo",
    language: "en",
  } as const;

  it("returns temperature performance summary when telemetry exists", async () => {
    mockGetTemperaturePerformanceSummary.mockResolvedValue({
      sensor: "sensor-temp-001",
      unit: "°C",
      count: 100,
      minimum: 2,
      maximum: 8,
      average: 5,
      firstReadingAt: "2026-08-01T00:00:00Z",
      lastReadingAt: "2026-08-24T00:00:00Z",
    });

    const result = await service.preview(request);

    expect(mockGetTemperaturePerformanceSummary).toHaveBeenCalledWith({
      sensorCode: "sensor-temp-001",
      from: "2026-08-01T00:00:00Z",
      to: "2026-08-24T00:00:00Z",
    });

    expect(result.identity.reportType).toBe(
      "TEMP-PERFORMANCE",
    );

    expect(result.quality.complete).toBe(true);

    expect(result.summary).toEqual({
      sensors: 1,
      records: 100,
      minimum: 2,
      maximum: 8,
      average: 5,
    });

    expect(result.sensors).toEqual([
      {
        sensor: "sensor-temp-001",
        unit: "°C",
        records: 100,
        minimum: 2,
        maximum: 8,
        average: 5,
        firstReadingAt:
          "2026-08-01T00:00:00Z",
        lastReadingAt:
          "2026-08-24T00:00:00Z",
      },
    ]);
  });

  it("returns incomplete report when telemetry is missing", async () => {
    mockGetTemperaturePerformanceSummary.mockResolvedValue(
      null,
    );

    const result = await service.preview(request);

    expect(mockGetTemperaturePerformanceSummary).toHaveBeenCalledWith({
      sensorCode: "sensor-temp-001",
      from: "2026-08-01T00:00:00Z",
      to: "2026-08-24T00:00:00Z",
    });

    expect(result.quality.complete).toBe(false);

    expect(result.quality.warnings).toEqual([
      "some sensors have no telemetry",
    ]);

    expect(result.quality.unavailableSections).toEqual([
      "temperature-data",
    ]);

    expect(result.summary).toEqual({
      sensors: 0,
      records: 0,
      minimum: null,
      maximum: null,
      average: null,
    });

    expect(result.sensors).toEqual([]);
  });
});