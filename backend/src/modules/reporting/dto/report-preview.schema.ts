import { z } from "zod";

const sensorIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(100);

const baseReportSchema = z.object({
  reportType: z.enum([
    "CALIBRATION-HISTORY",
    "TEMP-PERFORMANCE",
  ]),

  contractVersion: z.literal("1.0"),

  sensorUuids: z
    .array(sensorIdentifier)
    .min(1)
    .max(100)
    .refine(
      (values) =>
        new Set(values).size === values.length,
      "sensorUuids must not contain duplicates",
    ),

  from: z.iso.datetime({
    offset: true,
  }),

  to: z.iso.datetime({
    offset: true,
  }),

  timeZone: z.string().trim().min(1),

  language: z.enum([
    "en",
    "ar",
  ]),
});

export const reportPreviewSchema =
  baseReportSchema
    .strict()
    .superRefine((value, context) => {
      const from = Date.parse(value.from);
      const to = Date.parse(value.to);

      if (to <= from) {
        context.addIssue({
          code: "custom",
          path: ["to"],
          message:
            "to must be later than from",
        });
      }
    });

export type ReportPreviewRequest =
  z.infer<typeof reportPreviewSchema>;