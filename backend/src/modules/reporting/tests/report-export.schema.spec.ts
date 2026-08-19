import { describe, expect, it } from "vitest";
import { reportExportSchema } from "../dto/report-export.schema";

const request = {
  reportType: "CALIBRATION-HISTORY",
  contractVersion: "1.0",
  format: "CSV",
  sensorUuids: ["sensor-temp-001"],
  from: "2026-01-01T00:00:00Z",
  to: "2026-02-01T00:00:00Z",
  timeZone: "Africa/Cairo",
  language: "en",
};

describe("report export request", () => {
  it("accepts only the approved CSV export", () =>
    expect(reportExportSchema.safeParse(request).success).toBe(true));
  it("rejects PDF and unknown fields", () => {
    expect(reportExportSchema.safeParse({ ...request, format: "PDF" }).success).toBe(false);
    expect(reportExportSchema.safeParse({ ...request, extra: true }).success).toBe(false);
  });
});
