import { z } from "zod";
import { CALIBRATION_RESULTS } from "../../../domain/enums/calibration-result";

const optionalText = (field: string, maxLength: number) =>
  z.string().trim().min(1, `${field} cannot be empty`).max(maxLength).optional();

const dateTime = (field: string) =>
  z.iso.datetime({ offset: true, error: `${field} must be an ISO 8601 datetime` });

export const sensorCalibrationParamsSchema = z
  .object({
    sensorUuid: z.string().trim().uuid("sensorUuid must be a valid UUID"),
  })
  .strict();

export const calibrationListQuerySchema = z.object({}).strict();

export const createCalibrationRecordSchema = z
  .object({
    result: z.enum(CALIBRATION_RESULTS),
    performed_at: dateTime("performed_at"),
    due_at: dateTime("due_at").optional(),
    offset: z.number().finite().optional(),
    certificate_reference: optionalText("certificate_reference", 200),
    notes: optionalText("notes", 2000),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.result === "PASS" && record.due_at === undefined) {
      context.addIssue({
        code: "custom",
        path: ["due_at"],
        message: "due_at is required for a passing calibration",
      });
    }

    if (record.result === "PASS" && record.offset === undefined) {
      context.addIssue({
        code: "custom",
        path: ["offset"],
        message: "offset is required for a passing calibration",
      });
    }

    if (
      record.due_at !== undefined &&
      Date.parse(record.due_at) <= Date.parse(record.performed_at)
    ) {
      context.addIssue({
        code: "custom",
        path: ["due_at"],
        message: "due_at must be later than performed_at",
      });
    }
  });

export type CreateCalibrationRecordInput = z.infer<typeof createCalibrationRecordSchema>;
