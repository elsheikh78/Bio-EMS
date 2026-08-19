import { z } from "zod";

export const reportTypeSchema = z
  .object({
    id: z.enum([
      "TEMP-PERFORMANCE",
      "ALARM-HISTORY",
      "CALIBRATION-HISTORY",
      "DEVICE-HEALTH",
      "AUDIT-OPERATIONS",
    ]),
    title: z.string(),
    readiness: z.enum([
      "PARTIAL",
      "READY_FOR_IMPLEMENTATION",
      "AVAILABLE",
      "BLOCKED",
    ]),
    previewAvailable: z.boolean(),
    exportFormats: z.array(z.enum(["PDF", "CSV"])),
    unavailableReason: z.string().nullable(),
  })
  .strict();

export const reportCatalogueSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    limits: z
      .object({
        previewMaximumDays: z.number().int().positive(),
        previewMaximumPoints: z.number().int().positive(),
        rawCsvMaximumDays: z.number().int().positive(),
        rawCsvMaximumRows: z.number().int().positive(),
        aggregatedMaximumDays: z.number().int().positive(),
        aggregatedMaximumRows: z.number().int().positive(),
        recordReportMaximumDays: z.number().int().positive(),
      })
      .strict(),
    formats: z.array(z.enum(["PREVIEW", "PDF", "CSV"])),
    reportTypes: z.array(reportTypeSchema),
  })
  .strict();

export type ReportCatalogue = z.infer<typeof reportCatalogueSchema>;

export const calibrationReportPreviewRequestSchema = z
  .object({
    reportType: z.literal("CALIBRATION-HISTORY"),
    contractVersion: z.literal("1.0"),
    sensorUuids: z.array(z.string()).min(1).max(100),
    from: z.string(),
    to: z.string(),
    timeZone: z.string(),
    language: z.enum(["en", "ar"]),
  })
  .strict();

export const calibrationReportPreviewResultSchema = z
  .object({
    identity: z
      .object({
        reportId: z.string(),
        reportType: z.literal("CALIBRATION-HISTORY"),
        contractVersion: z.literal("1.0"),
      })
      .strict(),
    scope: calibrationReportPreviewRequestSchema.omit({
      reportType: true,
      contractVersion: true,
    }),
    provenance: z
      .object({
        generatedAt: z.string(),
        source: z.literal("SQLITE"),
        rangeSemantics: z.literal("[from,to)"),
      })
      .strict(),
    quality: z
      .object({
        complete: z.boolean(),
        warnings: z.array(
          z.object({ code: z.string(), sensorUuid: z.string() }).strict(),
        ),
        unavailableSections: z.array(z.string()),
      })
      .strict(),
    summary: z
      .object({
        sensors: z.number(),
        records: z.number(),
        pass: z.number(),
        fail: z.number(),
        overdue: z.number(),
        notCalibrated: z.number(),
      })
      .strict(),
    sensors: z.array(
      z
        .object({
          uuid: z.string(),
          code: z.string(),
          name: z.string(),
          room_code: z.string(),
          room_name: z.string(),
          site_code: z.string(),
          site_name: z.string(),
          dueClassification: z.enum(["CURRENT", "OVERDUE", "NOT_CALIBRATED"]),
        })
        .passthrough(),
    ),
    records: z.array(
      z
        .object({
          sensor_uuid: z.string(),
          result: z.enum(["PASS", "FAIL"]),
          performed_at: z.string(),
        })
        .passthrough(),
    ),
  })
  .strict();

export type CalibrationReportPreviewRequest = z.infer<
  typeof calibrationReportPreviewRequestSchema
>;
export type CalibrationReportPreviewResult = z.infer<
  typeof calibrationReportPreviewResultSchema
>;

export type CalibrationReportExportRequest = CalibrationReportPreviewRequest & {
  format: "CSV";
};
