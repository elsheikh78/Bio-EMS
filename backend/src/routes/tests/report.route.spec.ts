import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

vi.mock("../../modules/reporting/calibration-report.service", () => ({
  CalibrationReportService: vi.fn().mockImplementation(() => ({
    preview: vi.fn(() => ({
      identity: {
        reportId: "RPT-20260819-TEST",
        reportType: "CALIBRATION-HISTORY",
        contractVersion: "1.0",
      },

      scope: {
        sensorUuids: ["sensor-temp-001"],
        from: "2026-01-01T00:00:00Z",
        to: "2027-01-01T00:00:00Z",
        timeZone: "Africa/Cairo",
        language: "en",
      },

      provenance: {
        generatedAt: "2026-08-19T12:00:00Z",
        source: "SQLITE",
        rangeSemantics: "[from,to)",
      },

      quality: {
        complete: true,
        warnings: [],
        unavailableSections: [],
      },

      summary: {
        sensors: 1,
        records: 1,
        pass: 1,
        fail: 0,
        overdue: 0,
        notCalibrated: 0,
      },

      sensors: [
        {
          uuid: "sensor-temp-001",
          code: "TEMP-001",
          name: "Room sensor",
          sensor_type: "temperature",
          unit: "°C",
          site_code: "BIO-EGYPT",
          site_name: "Bio Egypt",
          room_code: "CR-1",
          room_name: "Cold Room 1",
        },
      ],

      records: [
        {
          sensor_uuid: "sensor-temp-001",
          result: "PASS",
          performed_at: "2026-08-19T10:00:00Z",
          due_at: "2027-08-19T10:00:00Z",
          offset: 0,
          certificate_reference: "CERT-1",
          notes: null,
          performed_by_username: "admin",
        },
      ],
    })),
  })),
}));

vi.mock("../../modules/reporting/temperature-performance-report.service", () => ({
  TemperaturePerformanceReportService: vi.fn().mockImplementation(() => ({
    preview: vi.fn(() => ({
      identity: {
        reportId: "RPT-TEMP-20260824-TEST",
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
        generatedAt: "2026-08-24T12:00:00Z",
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
          firstReadingAt: "2026-08-01T00:00:00Z",
          lastReadingAt: "2026-08-24T00:00:00Z",
        },
      ],

      summary: {
        sensors: 1,
        records: 100,
        minimum: 2,
        maximum: 8,
        average: 5,
      },
    })),
  })),
}));

vi.mock("../../modules/reporting/temperature-performance-csv.renderer", () => ({
  temperaturePerformanceCsvFilename: vi.fn(() => "temp-performance-2026-08-24.csv"),

  renderTemperaturePerformanceCsv: vi.fn(() => "BIO-EMS Temperature Performance Report"),
}));

vi.mock("../../modules/reporting/temperature-performance-pdf.renderer", () => ({
  temperaturePerformancePdfFilename: vi.fn(() => "temp-performance-2026-08-24.pdf"),

  renderTemperaturePerformancePdf: vi.fn(() => Promise.resolve(Buffer.from("%PDF-TEST"))),
}));

import reportRouter from "../report.route";

function createApp(role: "ADMIN" | "OPERATOR" | "VIEWER") {
  const app = express();

  app.use(express.json());

  app.use((req, _res, next) => {
    req.user = {
      id: 1,
      username: role.toLowerCase(),
      role,
    };

    next();
  });

  app.use("/api/v1/reports", reportRouter);

  app.use(errorMiddleware);

  return app;
}

describe("Reporting REST API", () => {
  it("previews temperature performance report", async () => {
    const response = await request(createApp("ADMIN"))
      .post("/api/v1/reports/preview")
      .send({
        reportType: "TEMP-PERFORMANCE",
        contractVersion: "1.0",
        sensorUuids: ["sensor-temp-001"],
        from: "2026-08-01T00:00:00Z",
        to: "2026-08-24T00:00:00Z",
        timeZone: "Africa/Cairo",
        language: "en",
      })
      .expect(200);

    expect(response.body.identity.reportType).toBe("TEMP-PERFORMANCE");

    expect(response.body.summary.average).toBe(5);
  });

  it("exports calibration history as PDF for ADMIN", async () => {
    const response = await request(createApp("ADMIN"))
      .post("/api/v1/reports/exports")
      .send({
        reportType: "CALIBRATION-HISTORY",
        contractVersion: "1.0",
        format: "PDF",
        sensorUuids: ["sensor-temp-001"],
        from: "2026-01-01T00:00:00Z",
        to: "2027-01-01T00:00:00Z",
        timeZone: "Africa/Cairo",
        language: "en",
      })
      .expect(200);

    expect(response.headers["content-type"]).toContain("application/pdf");

    expect(response.headers["content-disposition"]).toContain(".pdf");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    expect(response.body.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("exports temperature performance as CSV for ADMIN", async () => {
    const response = await request(createApp("ADMIN"))
      .post("/api/v1/reports/exports")
      .send({
        reportType: "TEMP-PERFORMANCE",
        contractVersion: "1.0",
        format: "CSV",
        sensorUuids: ["sensor-temp-001"],
        from: "2026-08-01T00:00:00Z",
        to: "2026-08-24T00:00:00Z",
        timeZone: "Africa/Cairo",
        language: "en",
      })
      .expect(200);

    expect(response.headers["content-type"]).toContain("text/csv");

    expect(response.headers["content-disposition"]).toContain(".csv");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    expect(response.text).toContain("BIO-EMS Temperature Performance Report");
  });

  it("exports temperature performance as PDF for ADMIN", async () => {
    const response = await request(createApp("ADMIN"))
      .post("/api/v1/reports/exports")
      .send({
        reportType: "TEMP-PERFORMANCE",
        contractVersion: "1.0",
        format: "PDF",
        sensorUuids: ["sensor-temp-001"],
        from: "2026-08-01T00:00:00Z",
        to: "2026-08-24T00:00:00Z",
        timeZone: "Africa/Cairo",
        language: "en",
      })
      .expect(200);

    expect(response.headers["content-type"]).toContain("application/pdf");

    expect(response.headers["content-disposition"]).toContain(".pdf");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    expect(response.body.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
