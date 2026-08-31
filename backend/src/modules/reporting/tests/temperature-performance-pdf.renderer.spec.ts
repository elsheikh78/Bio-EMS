import { describe, expect, it } from "vitest";
import {
  renderTemperaturePerformancePdf,
  temperaturePerformancePdfFilename,
} from "../temperature-performance-pdf.renderer";

const report = {
  identity: {
    reportId: "TEMP-TEST-1",
    reportType: "TEMP-PERFORMANCE" as const,
    contractVersion: "1.0" as const,
  },
  scope: {
    sensorUuids: ["TEMP-01"],
    from: "2026-08-01T00:00:00Z",
    to: "2026-08-31T00:00:00Z",
    timeZone: "Africa/Cairo",
    language: "en" as const,
  },
  provenance: {
    generatedAt: "2026-08-31T08:00:00Z",
    source: "INFLUXDB" as const,
    rangeSemantics: "[from,to)" as const,
  },
  quality: { complete: true, warnings: [], unavailableSections: [] },
  sensors: [
    {
      sensor: "TEMP-01",
      unit: "°C",
      records: 100,
      minimum: 2,
      maximum: 8,
      average: 5,
      firstReadingAt: "2026-08-01T00:00:00Z",
      lastReadingAt: "2026-08-30T23:59:00Z",
    },
  ],
  summary: { sensors: 1, records: 100, minimum: 2, maximum: 8, average: 5 },
};

describe("Temperature performance PDF renderer", () => {
  it("renders the canonical temperature result as a valid PDF", async () => {
    const pdf = await renderTemperaturePerformancePdf(report, "admin");
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
  });

  it("produces a normalized filename", () => {
    expect(temperaturePerformancePdfFilename(report)).toBe(
      "bio-ems_temperature-performance_2026-08-01_2026-08-31_temp-test-1.pdf"
    );
  });
});
