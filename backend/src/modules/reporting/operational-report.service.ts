import type { ReportPreviewRequest } from "./dto/report-preview.schema";
import {
  OperationalReportRepository,
  type OperationalReportType,
} from "./operational-report.repository";

export class OperationalReportService {
  constructor(private readonly repository = new OperationalReportRepository()) {}

  preview(request: ReportPreviewRequest) {
    const reportType = request.reportType as OperationalReportType;
    const records = this.repository.list(
      reportType,
      request.sensorUuids,
      request.from,
      request.to
    ) as Array<Record<string, string | number | null>>;
    const resultCounts = records.reduce<Record<string, number>>((counts, record) => {
      const key = String(record.status ?? record.result ?? record.event_type ?? "RECORDED");
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});

    return {
      identity: {
        reportType,
        contractVersion: request.contractVersion,
        reportId: `${reportType}-${Date.now()}`,
      },
      scope: {
        sensorUuids: request.sensorUuids,
        from: request.from,
        to: request.to,
        timeZone: request.timeZone,
        language: request.language,
      },
      provenance: {
        generatedAt: new Date().toISOString(),
        source: "SQLITE" as const,
        rangeSemantics: "[from,to)" as const,
      },
      quality: {
        complete: true,
        warnings:
          reportType === "DEVICE-HEALTH"
            ? ["history is available from ledger deployment onward"]
            : [],
        unavailableSections: [],
      },
      summary: { records: records.length, resultCounts },
      records,
    };
  }
}
