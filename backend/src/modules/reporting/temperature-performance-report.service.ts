import type { ReportPreviewRequest } from "./dto/report-preview.schema";

export class TemperaturePerformanceReportService {
  async preview(request: ReportPreviewRequest) {
    const { getTemperaturePerformanceSummary } = await import(
      "../../../database/influx/queries/temperature-performance.query"
    );

    const sensorSummaries = await Promise.all(
      request.sensorUuids.map((sensorCode) =>
        getTemperaturePerformanceSummary({
          sensorCode,
          from: request.from,
          to: request.to,
        }),
      ),
    );

    const availableSummaries = sensorSummaries.filter(
      (summary) => summary !== null,
    );

    const totalRecords = availableSummaries.reduce(
      (total, summary) =>
        total + (summary?.count ?? 0),
      0,
    );

    const minimumValues = availableSummaries
      .map((summary) => summary?.minimum)
      .filter(
        (value): value is number =>
          value !== null && value !== undefined,
      );

    const maximumValues = availableSummaries
      .map((summary) => summary?.maximum)
      .filter(
        (value): value is number =>
          value !== null && value !== undefined,
      );

    const weightedAverage =
      totalRecords > 0
        ? availableSummaries.reduce(
            (total, summary) =>
              total +
              (summary?.average ?? 0) *
                (summary?.count ?? 0),
            0,
          ) / totalRecords
        : null;

    return {
      identity: {
        reportType: request.reportType,
        contractVersion: request.contractVersion,
        reportId: `TEMP-${Date.now()}`,
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
        complete:
          availableSummaries.length ===
          request.sensorUuids.length,

        warnings:
          availableSummaries.length !==
          request.sensorUuids.length
            ? ["some sensors have no telemetry"]
            : [],

        unavailableSections:
          availableSummaries.length === 0
            ? ["temperature-data"]
            : [],
      },

      sensors: availableSummaries.map(
        (summary) => ({
          sensor: summary!.sensor,
          unit: summary!.unit,
          records: summary!.count,
          minimum: summary!.minimum,
          maximum: summary!.maximum,
          average: summary!.average,
          firstReadingAt:
            summary!.firstReadingAt,
          lastReadingAt:
            summary!.lastReadingAt,
        }),
      ),

      summary: {
        sensors: availableSummaries.length,

        records: totalRecords,

        minimum:
          minimumValues.length > 0
            ? Math.min(...minimumValues)
            : null,

        maximum:
          maximumValues.length > 0
            ? Math.max(...maximumValues)
            : null,

        average: weightedAverage,
      },
    };
  }
}