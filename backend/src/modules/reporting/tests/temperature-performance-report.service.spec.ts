import { describe, expect, it, vi } from "vitest";
import { TemperaturePerformanceReportService } from "../temperature-performance-report.service";

const getTemperaturePerformanceSummaryMock = vi.fn();

vi.mock("../../../../database/influx/queries/temperature-performance.query", () => ({
  getTemperaturePerformanceSummary: getTemperaturePerformanceSummaryMock,
}));

describe("TemperaturePerformanceReportService", () => {
  const service = new TemperaturePerformanceReportService();

  const request = {
    reportType: "TEMP-PERFORMANCE" as const,
    contractVersion: "1.0" as const,
    sensorUuids: ["sensor-temp-001"],
    from: "2026-08-01T00:00:00.000Z",
    to: "2026-08-02T00:00:00.000Z",
    timeZone: "Africa/Cairo",
    language: "en" as const,
  };

  it("returns temperature performance preview", async () => {
    getTemperaturePerformanceSummaryMock.mockResolvedValue({
      sensor: "sensor-temp-001",
      unit: "°C",
      count: 100,
      minimum: 2,
      maximum: 8,
      average: 5,
      firstReadingAt: "2026-08-01T00:00:00.000Z",
      lastReadingAt: "2026-08-01T23:59:00.000Z",
    });

    const result = await service.preview(request);

    expect(result.identity).toEqual({
      reportType: "TEMP-PERFORMANCE",
      contractVersion: "1.0",
    });

    expect(result.summary).toMatchObject({
      sensors: 1,
      records: 100,
      minimum: 2,
      maximum: 8,
      average: 5,
    });

    expect(getTemperaturePerformanceSummaryMock).toHaveBeenCalledWith({
      sensorCode: "sensor-temp-001",
      from: request.from,
      to: request.to,
    });
  });

  it("returns incomplete quality when no telemetry exists", async () => {
    getTemperaturePerformanceSummaryMock.mockResolvedValue(null);

    const result = await service.preview(request);

    expect(result.quality.complete).toBe(false);

    expect(result.summary).toEqual({
      sensors: 0,
      records: 0,
      minimum: null,
      maximum: null,
      average: null,
      firstReadingAt: null,
      lastReadingAt: null,
    });
  });
});