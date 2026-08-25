import type { ReportPreviewRequest } from "./dto/report-preview.schema";

export class TemperaturePerformanceReportService {
  async preview(request: ReportPreviewRequest) {
    const { getTemperaturePerformanceSummary } = await import(
      "../../../database/influx/queries/temperature-performance.query"
    );

    const summary = await getTemperaturePerformanceSummary({
      sensorCode: request.sensorUuids[0],
      from: request.from,
      to: request.to,
    });

    return {
      identity: {
        reportType: request.reportType,
        contractVersion: request.contractVersion,
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
        source: "INFLUXDB",
        rangeSemantics: "[from,to)",
      },

      quality: {
        complete: summary !== null,
        warnings: [],
        unavailableSections: summary ? [] : ["temperature-data"],
      },

      summary: summary
        ? {
            sensors: 1,
            records: summary.count,
            minimum: summary.minimum,
            maximum: summary.maximum,
            average: summary.average,
            firstReadingAt: summary.firstReadingAt,
            lastReadingAt: summary.lastReadingAt,
          }
        : {
            sensors: 0,
            records: 0,
            minimum: null,
            maximum: null,
            average: null,
            firstReadingAt: null,
            lastReadingAt: null,
          },
    };
  }
}