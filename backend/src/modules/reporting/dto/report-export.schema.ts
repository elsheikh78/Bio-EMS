import { z } from "zod";
import { calibrationReportPreviewSchema } from "./calibration-report-preview.schema";

export const reportExportSchema = calibrationReportPreviewSchema.extend({
  format: z.enum(["CSV", "PDF"]),
});

export type ReportExportRequest = z.infer<typeof reportExportSchema>;
