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
    readiness: z.enum(["PARTIAL", "READY_FOR_IMPLEMENTATION", "BLOCKED"]),
    previewAvailable: z.boolean(),
    exportFormats: z.array(z.enum(["PDF", "CSV"])),
    unavailableReason: z.string(),
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
