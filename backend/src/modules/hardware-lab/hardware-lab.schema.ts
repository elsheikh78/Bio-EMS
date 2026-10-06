import { z } from "zod";
import { hardwareLabFaultCodes } from "./hardware-lab.profile";

export const createHardwareTestRunSchema = z
  .object({
    prototype_type: z.literal("MAIN16_SIMD4").default("MAIN16_SIMD4"),
    main_hardware_uid: z.string().trim().min(1).max(128).optional(),
    sim_serial: z.string().trim().min(1).max(128).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const hardwareTestRunParamsSchema = z.object({ runId: z.string().uuid() }).strict();

export const hardwareTestStepParamsSchema = z
  .object({
    runId: z.string().uuid(),
    stepCode: z.string().regex(/^[A-Z0-9_]+$/),
  })
  .strict();

export const hardwareTestStepResultSchema = z
  .object({
    status: z.enum(["PASS", "FAIL"]),
    notes: z.string().trim().max(4000).optional(),
    metrics: z
      .array(
        z
          .object({
            key: z.string().trim().min(1).max(128),
            value_real: z.number().finite().optional(),
            value_text: z.string().max(1000).optional(),
            unit: z.string().trim().max(32).optional(),
            channel: z.string().trim().max(64).optional(),
          })
          .strict()
          .refine((value) => value.value_real !== undefined || value.value_text !== undefined, {
            message: "Measurement requires a value",
          })
      )
      .max(500)
      .default([]),
  })
  .strict();

export const hardwareFirmwareEvidenceSchema = z
  .object({
    target: z.enum(["MAIN16", "SIMD4", "SITE_CONTROLLER"]),
    firmware_name: z.string().trim().min(1).max(128),
    version: z.string().trim().min(1).max(64),
    git_commit: z.string().trim().max(64).optional(),
    sha256: z
      .string()
      .regex(/^[A-Fa-f0-9]{64}$/)
      .optional(),
    chip: z.string().trim().min(1).max(128),
    port: z.string().trim().max(64).optional(),
    flash_status: z.enum(["PENDING", "PASS", "FAIL"]),
    tool_output: z.string().max(12000).optional(),
  })
  .strict();

export const hardwareTestEventSchema = z
  .object({
    step_code: z
      .string()
      .regex(/^[A-Z0-9_]+$/)
      .optional(),
    event_code: z.enum(hardwareLabFaultCodes),
    expected: z.string().max(2000).optional(),
    observed: z.string().max(2000).optional(),
    severity: z.enum(["INFO", "WARNING", "ERROR"]).default("INFO"),
  })
  .strict();
