import { describe, expect, it } from "vitest";
import { calibrationReportPreviewSchema } from "../dto/calibration-report-preview.schema";

const valid = {
  reportType: "CALIBRATION-HISTORY",
  contractVersion: "1.0",
  sensorUuids: ["sensor-temp-001"],
  from: "2026-01-01T00:00:00Z",
  to: "2026-12-31T00:00:00Z",
  timeZone: "Africa/Cairo",
  language: "en",
} as const;

describe("calibration report preview request", () => {
  it("accepts an explicit bounded request", () =>
    expect(calibrationReportPreviewSchema.safeParse(valid).success).toBe(true));
  it("rejects inverted ranges", () =>
    expect(calibrationReportPreviewSchema.safeParse({ ...valid, to: valid.from }).success).toBe(
      false
    ));
  it("rejects a range over 366 days", () =>
    expect(
      calibrationReportPreviewSchema.safeParse({ ...valid, to: "2027-01-03T00:00:00Z" }).success
    ).toBe(false));
  it("rejects unknown fields and invalid zones", () =>
    expect(
      calibrationReportPreviewSchema.safeParse({ ...valid, timeZone: "Cairo", extra: true }).success
    ).toBe(false));
});
