import { describe, expect, it } from "vitest";
import { reportCatalogueSchema } from "./contracts";

describe("report catalogue contract", () => {
  it("parses the versioned five-family capability response", () => {
    const result = reportCatalogueSchema.parse({
      contractVersion: "1.0",
      limits: {
        previewMaximumDays: 31,
        previewMaximumPoints: 5000,
        rawCsvMaximumDays: 7,
        rawCsvMaximumRows: 250000,
        aggregatedMaximumDays: 366,
        aggregatedMaximumRows: 25000,
        recordReportMaximumDays: 366,
      },
      formats: ["PREVIEW", "PDF", "CSV"],
      reportTypes: [
        {
          id: "CALIBRATION-HISTORY",
          title: "Calibration Status and History",
          readiness: "AVAILABLE",
          previewAvailable: true,
          exportFormats: ["CSV", "PDF"],
          unavailableReason: null,
        },
      ],
    });
    expect(result.contractVersion).toBe("1.0");
    expect(result.reportTypes[0].exportFormats).toEqual(["CSV", "PDF"]);
  });

  it("rejects an unsupported report family", () => {
    expect(() =>
      reportCatalogueSchema.parse({
        contractVersion: "1.0",
        limits: {},
        formats: [],
        reportTypes: [{ id: "INVENTED" }],
      }),
    ).toThrow();
  });
});
