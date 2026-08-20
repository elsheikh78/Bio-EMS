import { describe, expect, it, vi } from "vitest";
import type { ApiRequestOptions } from "../api/client";
import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import { createReportsApi } from "./api";

const exportRequest = {
  reportType: "CALIBRATION-HISTORY" as const,
  contractVersion: "1.0" as const,
  sensorUuids: ["sensor-temp-001"],
  from: "2026-01-01T00:00:00Z",
  to: "2026-02-01T00:00:00Z",
  timeZone: "Africa/Cairo",
  language: "en" as const,
  format: "PDF" as const,
};

describe("reports API", () => {
  it("requests calibration PDF export with the approved media type and filename", async () => {
    const response = new Response(new Blob(["%PDF-test"], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="bio-ems_calibration-history_2026-01-01_2026-02-01_rpt-test.pdf"',
      },
    });
    const protectedRequest = vi.fn(async <T>() => response as T) as unknown as ReturnType<
      typeof vi.fn
    > &
      AuthenticationContextValue["protectedRequest"];
    const api = createReportsApi(protectedRequest);

    const result = await api.exportCalibrationPdf(exportRequest);

    expect(protectedRequest).toHaveBeenCalledTimes(1);
    expect(protectedRequest).toHaveBeenCalledWith(
      "/reports/exports",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
        responseMode: "response",
      }),
    );

    const options = protectedRequest.mock.calls[0]?.[1] as
      | Omit<ApiRequestOptions, "auth">
      | undefined;
    expect(options?.body).toBeTypeOf("string");
    expect(JSON.parse(options?.body as string)).toEqual(exportRequest);
    expect(result.filename).toBe(
      "bio-ems_calibration-history_2026-01-01_2026-02-01_rpt-test.pdf",
    );
    expect(result.blob.type).toBe("application/pdf");
  });
});
