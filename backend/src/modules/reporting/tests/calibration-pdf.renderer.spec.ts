import { describe, expect, it } from "vitest";
import { calibrationPdfFilename, renderCalibrationPdf } from "../calibration-pdf.renderer";

function canonicalResult(recordCount = 1) {
  return {
    identity: {
      reportId: "RPT-20260820-TEST",
      reportType: "CALIBRATION-HISTORY" as const,
      contractVersion: "1.0" as const,
    },
    scope: {
      sensorUuids: ["sensor-1"],
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00Z",
      timeZone: "Africa/Cairo",
      language: "en" as const,
    },
    provenance: {
      generatedAt: "2026-02-01T12:00:00Z",
      source: "SQLITE" as const,
      rangeSemantics: "[from,to)" as const,
    },
    quality: {
      complete: false,
      warnings: [
        {
          code: "MISSING_HARDWARE_MODEL",
          sensorUuid: "sensor-1",
        },
      ],
      unavailableSections: [],
    },
    summary: {
      sensors: 1,
      records: recordCount,
      pass: recordCount,
      fail: 0,
      overdue: 0,
      notCalibrated: 0,
    },
    sensors: [
      {
        id: 1,
        uuid: "sensor-1",
        code: "TEMP-1",
        name: "Cold Room Sensor",
        sensor_type: "temperature",
        unit: "°C",
        product_grade: "STANDARD",
        hardware_model: null,
        calibration_status: "VALID",
        last_calibrated_at: "2026-01-02T00:00:00Z",
        calibration_due_at: "2027-01-02T00:00:00Z",
        calibration_offset: 0.1,
        certificate_reference: "CERT-1",
        room_uuid: "room-1",
        room_code: "CR-1",
        room_name: "Cold Room 1",
        site_code: "BIO-EGYPT",
        site_name: "Bio Egypt",
        dueClassification: "CURRENT" as const,
      },
    ],
    records: Array.from({ length: recordCount }, (_, index) => ({
      id: index + 1,
      sensor_uuid: "sensor-1",
      result: "PASS" as const,
      performed_at: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`,
      due_at: "2027-01-02T00:00:00Z",
      offset: 0.1,
      certificate_reference: `CERT-${index + 1}`,
      notes:
        index === 0
          ? "Representative calibration evidence with a long note that must remain printable."
          : null,
      performed_by_username: "admin",
    })),
  };
}

describe("Calibration PDF renderer", () => {
  it("renders a valid PDF from the canonical calibration result", async () => {
    const pdf = await renderCalibrationPdf(canonicalResult(), "operator");

    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
  });

  it("renders multi-page calibration evidence", async () => {
    const pdf = await renderCalibrationPdf(canonicalResult(80), "operator");

    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2_000);
  });

  it("produces a normalized PDF filename", () => {
    expect(calibrationPdfFilename(canonicalResult())).toBe(
      "bio-ems_calibration-history_2026-01-01_2026-02-01_rpt-20260820-test.pdf"
    );
  });
});
