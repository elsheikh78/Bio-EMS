import { z } from "zod";

const sensorIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(
    (value) =>
      z.string().uuid().safeParse(value).success ||
      /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value) ||
      /^sensor-[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value),
    "sensorUuids contains an unsupported Sensor identifier"
  );

export const calibrationReportPreviewSchema = z
  .object({
    reportType: z.literal("CALIBRATION-HISTORY"),
    contractVersion: z.literal("1.0"),
    sensorUuids: z
      .array(sensorIdentifier)
      .min(1)
      .max(100)
      .refine(
        (values) => new Set(values).size === values.length,
        "sensorUuids must not contain duplicates"
      ),
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
    timeZone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value }).format();
          return true;
        } catch {
          return false;
        }
      }, "timeZone must be a valid IANA time zone"),
    language: z.enum(["en", "ar"]),
  })
  .strict()
  .superRefine((value, context) => {
    const from = Date.parse(value.from);
    const to = Date.parse(value.to);
    if (to <= from) {
      context.addIssue({ code: "custom", path: ["to"], message: "to must be later than from" });
    } else if (to - from > 366 * 24 * 60 * 60 * 1000) {
      context.addIssue({ code: "custom", path: ["to"], message: "range must not exceed 366 days" });
    }
  });

export type CalibrationReportPreviewRequest = z.infer<typeof calibrationReportPreviewSchema>;
