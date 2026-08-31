import { describe, expect, it } from "vitest";
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
    const response = new Response("%PDF-test", {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="bio-ems_calibration-history_2026-01-01_2026-02-01_rpt-test.pdf"',
      },
    });

    let capturedPath: `/${string}` | undefined;
    let capturedOptions: Omit<ApiRequestOptions, "auth"> | undefined;

    const protectedRequest: AuthenticationContextValue["protectedRequest"] = <
      T,
    >(
      path: `/${string}`,
      options?: Omit<ApiRequestOptions, "auth">,
    ) => {
      capturedPath = path;
      capturedOptions = options;
      return Promise.resolve(response as T);
    };

    const api = createReportsApi(protectedRequest);
    const result = await api.exportCalibrationPdf(exportRequest);

    expect(capturedPath).toBe("/reports/exports");
    expect(capturedOptions).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
        responseMode: "response",
      }),
    );

    expect(capturedOptions?.body).toBeTypeOf("string");
    expect(JSON.parse(capturedOptions?.body as string)).toEqual(exportRequest);

    expect(result.filename).toBe(
      "bio-ems_calibration-history_2026-01-01_2026-02-01_rpt-test.pdf",
    );
    expect(result.blob.type).toBe("application/pdf");
  });

  it.each([
    [
      "CSV" as const,
      "text/csv",
      "bio-ems_alarm-history_2026-01-01_2026-02-01.csv",
    ],
    [
      "PDF" as const,
      "application/pdf",
      "bio-ems_alarm-history_2026-01-01_2026-02-01.pdf",
    ],
  ])(
    "requests operational %s export without passing format through strict preview validation",
    async (format, accept, filename) => {
      const response = new Response(
        format === "PDF" ? "%PDF-test" : "id,status",
        {
          status: 200,
          headers: {
            "Content-Type": accept,
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        },
      );
      let capturedOptions: Omit<ApiRequestOptions, "auth"> | undefined;
      const protectedRequest: AuthenticationContextValue["protectedRequest"] = <
        T,
      >(
        _path: `/${string}`,
        options?: Omit<ApiRequestOptions, "auth">,
      ) => {
        capturedOptions = options;
        return Promise.resolve(response as T);
      };
      const api = createReportsApi(protectedRequest);
      const result = await api.exportOperational({
        ...exportRequest,
        reportType: "ALARM-HISTORY",
        format,
      });

      expect(capturedOptions).toEqual(
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: accept },
          responseMode: "response",
        }),
      );
      expect(JSON.parse(capturedOptions?.body as string)).toEqual({
        ...exportRequest,
        reportType: "ALARM-HISTORY",
        format,
      });
      expect(result.filename).toBe(filename);
      expect(result.blob.type).toBe(accept);
    },
  );
});
