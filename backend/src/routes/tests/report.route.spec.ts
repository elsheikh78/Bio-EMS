import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

vi.mock("../../modules/reporting/calibration-report.service", () => {
  return {
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
            id: 1,
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
            id: 1,
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
  };
});

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

describe("Reporting catalogue REST API", () => {
  it.each(["ADMIN", "OPERATOR", "VIEWER"] as const)(
    "allows %s to read the approved catalogue",
    async (role) => {
      const response = await request(createApp(role)).get("/api/v1/reports/catalogue").expect(200);

      expect(response.body.contractVersion).toBe("1.0");

      expect(response.body.reportTypes).toHaveLength(5);

      expect(response.body.reportTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "CALIBRATION-HISTORY",
            readiness: "AVAILABLE",
            previewAvailable: true,
            exportFormats: ["CSV"],
          }),
          expect.objectContaining({
            id: "DEVICE-HEALTH",
            readiness: "BLOCKED",
          }),
          expect.objectContaining({
            id: "AUDIT-OPERATIONS",
            readiness: "BLOCKED",
          }),
        ])
      );
    }
  );

  it.each(["ADMIN", "OPERATOR"] as const)(
    "allows %s through the export permission gate before request validation",
    async (role) => {
      await request(createApp(role)).post("/api/v1/reports/exports").expect(400);
    }
  );

  it("denies CSV export to VIEWER", async () => {
    const response = await request(createApp("VIEWER")).post("/api/v1/reports/exports").expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
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
});
