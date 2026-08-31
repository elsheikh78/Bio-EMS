import { describe, expect, it, vi } from "vitest";
import { renderOperationalCsv } from "../operational-csv.renderer";
import { renderOperationalPdf } from "../operational-pdf.renderer";
import { OperationalReportService } from "../operational-report.service";

const request = {
  reportType: "ALARM-HISTORY" as const,
  contractVersion: "1.0" as const,
  sensorUuids: ["sensor-1"],
  from: "2026-08-01T00:00:00.000Z",
  to: "2026-09-01T00:00:00.000Z",
  timeZone: "Africa/Cairo",
  language: "en" as const,
};

describe("OperationalReportService", () => {
  it("builds a traceable preview and result counts", () => {
    const repository = {
      list: vi.fn().mockReturnValue([
        { id: 1, status: "ACTIVE", sensor_uuid: "sensor-1" },
        { id: 2, status: "RECOVERED", sensor_uuid: "sensor-1" },
      ]),
    };
    const result = new OperationalReportService(repository as never).preview(request);

    expect(repository.list).toHaveBeenCalledWith(
      "ALARM-HISTORY",
      ["sensor-1"],
      request.from,
      request.to
    );
    expect(result.summary).toEqual({ records: 2, resultCounts: { ACTIVE: 1, RECOVERED: 1 } });
    expect(result.identity.reportType).toBe("ALARM-HISTORY");
    expect(result.provenance.rangeSemantics).toBe("[from,to)");
    expect(result.quality.complete).toBe(true);
  });

  it("discloses the Device Health history boundary", () => {
    const service = new OperationalReportService({ list: vi.fn().mockReturnValue([]) } as never);
    const result = service.preview({ ...request, reportType: "DEVICE-HEALTH" });

    expect(result.quality.warnings).toContain("history is available from ledger deployment onward");
  });

  it("renders deterministic CSV and valid PDF exports", async () => {
    const service = new OperationalReportService({
      list: vi.fn().mockReturnValue([{ id: 1, status: "ACTIVE", note: 'quoted "value"' }]),
    } as never);
    const result = service.preview(request);

    expect(renderOperationalCsv(result, "operator")).toContain('"quoted ""value"""');
    const pdf = await renderOperationalPdf(result, "operator");
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
