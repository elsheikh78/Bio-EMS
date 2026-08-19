import { describe, expect, it } from "vitest";
import type { CalibrationReportRepository } from "../../../repositories/calibration-report.repository";
import { CalibrationReportService } from "../calibration-report.service";

const request = {
  reportType: "CALIBRATION-HISTORY" as const,
  contractVersion: "1.0" as const,
  sensorUuids: ["sensor-temp-001"],
  from: "2026-01-01T00:00:00Z",
  to: "2027-01-01T00:00:00Z",
  timeZone: "Africa/Cairo",
  language: "en" as const,
};

describe("CalibrationReportService", () => {
  it("builds one canonical preview and classifies due state at generatedAt", () => {
    const repository = {
      findSensors: () => [
        {
          id: 1,
          uuid: "sensor-temp-001",
          code: "TEMP-001",
          name: "Room sensor",
          sensor_type: "temperature",
          unit: "°C",
          product_grade: "STANDARD",
          hardware_model: null,
          calibration_status: "VALID",
          last_calibrated_at: "2026-01-01T00:00:00Z",
          calibration_due_at: "2026-06-01T00:00:00Z",
          calibration_offset: 0.1,
          certificate_reference: "CERT-1",
          room_uuid: "room-1",
          room_code: "CR-1",
          room_name: "Cold Room 1",
          site_code: "BIO-EGYPT",
          site_name: "Bio Egypt",
        },
      ],
      findRecords: () => [
        {
          id: 10,
          sensor_uuid: "sensor-temp-001",
          result: "PASS" as const,
          performed_at: "2026-01-01T00:00:00Z",
          due_at: "2026-06-01T00:00:00Z",
          offset: 0.1,
          certificate_reference: "CERT-1",
          notes: null,
          performed_by_username: "admin",
        },
      ],
    } as unknown as CalibrationReportRepository;
    const result = new CalibrationReportService(
      repository,
      () => new Date("2026-08-19T12:00:00Z"),
      () => "RPT-20260819-TEST"
    ).preview(request);

    expect(result.identity.reportId).toBe("RPT-20260819-TEST");
    expect(result.provenance).toEqual(
      expect.objectContaining({ source: "SQLITE", rangeSemantics: "[from,to)" })
    );
    expect(result.summary).toEqual(
      expect.objectContaining({ sensors: 1, records: 1, pass: 1, overdue: 1 })
    );
    expect(result.sensors[0].dueClassification).toBe("OVERDUE");
    expect(result.quality).toEqual(
      expect.objectContaining({
        complete: false,
        warnings: [{ code: "MISSING_HARDWARE_MODEL", sensorUuid: "sensor-temp-001" }],
      })
    );
  });

  it("rejects the whole request if any Sensor is outside the valid scope", () => {
    const repository = {
      findSensors: () => [],
      findRecords: () => [],
    } as unknown as CalibrationReportRepository;
    expect(() => new CalibrationReportService(repository).preview(request)).toThrowError(
      expect.objectContaining({ code: "REPORT_SCOPE_INVALID", statusCode: 400 })
    );
  });
});
