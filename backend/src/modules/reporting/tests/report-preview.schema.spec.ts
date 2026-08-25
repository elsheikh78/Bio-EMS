import { describe, expect, it } from "vitest";
import { reportPreviewSchema } from "../dto/report-preview.schema";

describe("reportPreviewSchema", () => {
  const validPayload = {
    reportType: "TEMP-PERFORMANCE",
    contractVersion: "1.0",
    sensorUuids: ["sensor-temp-001"],
    from: "2026-08-01T00:00:00Z",
    to: "2026-08-24T00:00:00Z",
    timeZone: "Africa/Cairo",
    language: "en",
  };

  it("accepts valid temperature performance preview request", () => {
    const result = reportPreviewSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  it("accepts valid calibration history preview request", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      reportType: "CALIBRATION-HISTORY",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty sensor list", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      sensorUuids: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicated sensor identifiers", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      sensorUuids: ["sensor-temp-001", "sensor-temp-001"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid date range", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      from: "2026-08-24T00:00:00Z",
      to: "2026-08-01T00:00:00Z",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported report type", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      reportType: "UNKNOWN",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid contract version", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      contractVersion: "2.0",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid language", () => {
    const result = reportPreviewSchema.safeParse({
      ...validPayload,
      language: "fr",
    });

    expect(result.success).toBe(false);
  });
});
