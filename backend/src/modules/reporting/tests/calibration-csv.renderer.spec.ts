import { describe, expect, it } from "vitest";
import { renderCalibrationCsv } from "../calibration-csv.renderer";

describe("Calibration CSV renderer", () => {
  it("renders UTF-8 BOM, CRLF, canonical metadata, and spreadsheet-safe text", () => {
    const csv = renderCalibrationCsv(
      {
        identity: { reportId: "RPT-1", reportType: "CALIBRATION-HISTORY", contractVersion: "1.0" },
        scope: {
          sensorUuids: ["sensor-1"],
          from: "2026-01-01T00:00:00Z",
          to: "2026-02-01T00:00:00Z",
          timeZone: "Africa/Cairo",
          language: "en",
        },
        provenance: {
          generatedAt: "2026-02-01T12:00:00Z",
          source: "SQLITE",
          rangeSemantics: "[from,to)",
        },
        quality: { complete: true, warnings: [], unavailableSections: [] },
        summary: { sensors: 1, records: 1, pass: 1, fail: 0, overdue: 0, notCalibrated: 0 },
        sensors: [
          {
            id: 1,
            uuid: "sensor-1",
            code: "TEMP-1",
            name: "Sensor",
            sensor_type: "temperature",
            unit: "°C",
            product_grade: "STANDARD",
            hardware_model: "DS18B20",
            calibration_status: "VALID",
            last_calibrated_at: "2026-01-02T00:00:00Z",
            calibration_due_at: "2027-01-02T00:00:00Z",
            calibration_offset: 0,
            certificate_reference: "CERT",
            room_uuid: "room-1",
            room_code: "CR-1",
            room_name: "Cold Room",
            site_code: "SITE-1",
            site_name: "Bio Egypt",
            dueClassification: "CURRENT" as const,
          },
        ],
        records: [
          {
            id: 1,
            sensor_uuid: "sensor-1",
            result: "PASS" as const,
            performed_at: "2026-01-02T00:00:00Z",
            due_at: "2027-01-02T00:00:00Z",
            offset: 0,
            certificate_reference: "=unsafe",
            notes: "line, with comma",
            performed_by_username: "admin",
          },
        ],
      },
      "+operator"
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.startsWith("\uFEFFsep=,\r\n")).toBe(true);
    expect(csv).toContain("\r\n");
    expect(csv).toContain('"RPT-1"');
    expect(csv).toContain('"\'=unsafe"');
    expect(csv).toContain('"\'+operator"');
    expect(csv).toContain('"line, with comma"');
    expect(csv.replaceAll("\r\n", "")).not.toContain("\n");
  });
});
