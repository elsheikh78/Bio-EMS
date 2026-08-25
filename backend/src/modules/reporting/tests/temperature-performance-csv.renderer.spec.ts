import { describe, expect, it } from "vitest";
import {
  renderTemperaturePerformanceCsv,
  temperaturePerformanceCsvFilename,
} from "../temperature-performance-csv.renderer";

describe("TemperaturePerformanceCsvRenderer", () => {
  const report = {
    identity: {
      reportType: "TEMP-PERFORMANCE",
      contractVersion: "1.0",
    },

    scope: {
      sensorUuids: ["sensor-temp-001"],
      from: "2026-08-01T00:00:00Z",
      to: "2026-08-24T00:00:00Z",
      timeZone: "Africa/Cairo",
      language: "en",
    },

    provenance: {
      generatedAt: "2026-08-25T10:00:00Z",
      source: "INFLUXDB",
      rangeSemantics: "[from,to)",
    },

    quality: {
      complete: true,
      warnings: [],
      unavailableSections: [],
    },

    sensors: [
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
    ],

    summary: {
      sensors: 1,
      records: 100,
      minimum: 2,
      maximum: 8,
      average: 5,
    },
  };

  it("generates temperature performance csv", () => {
    const csv =
      renderTemperaturePerformanceCsv(
        report,
        "admin",
      );

    expect(csv).toContain(
      "BIO-EMS Temperature Performance Report",
    );

    expect(csv).toContain(
      "sensor-temp-001",
    );

    expect(csv).toContain(
      "100",
    );
  });


  it("generates csv filename", () => {
    const filename =
      temperaturePerformanceCsvFilename(
        report,
      );

    expect(filename).toContain(
      "temp-performance",
    );

    expect(filename).toContain(
      ".csv",
    );
  });
});