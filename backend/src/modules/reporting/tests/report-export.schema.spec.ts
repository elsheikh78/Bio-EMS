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
  it.each(["CSV", "PDF"] as const)("accepts the approved %s export", (format) => {
    expect(reportExportSchema.safeParse({ ...request, format }).success).toBe(true);
  });

  it("rejects unknown formats and unknown fields", () => {
    expect(reportExportSchema.safeParse({ ...request, format: "XLSX" }).success).toBe(false);

    expect(reportExportSchema.safeParse({ ...request, extra: true }).success).toBe(false);
  });
});
