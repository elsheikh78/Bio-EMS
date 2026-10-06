import { z } from "zod";
import { HARDWARE_FAULT_CODES, HARDWARE_TEST_STEPS } from "./hardware-lab.profile";

const stepKeys = HARDWARE_TEST_STEPS.map((step) => step.key) as [string, ...string[]];

export const hardwareRunParamsSchema = z
  .object({
    runId: z.string().uuid(),
  })
  .strict();

export const hardwareStepParamsSchema = z
  .object({
    runId: z.string().uuid(),
    stepKey: z.enum(stepKeys),
  })
  .strict();

export const hardwareFirmwareParamsSchema = z
  .object({
    runId: z.string().uuid(),
    target: z.enum(["MAIN16_BENCH", "SIMD4_BENCH", "SITE_CONTROLLER_PILOT"]),
  })
  .strict();

export const createHardwareRunSchema = z
  .object({
    prototypeType: z.string().trim().min(1).max(80).default("MAIN-16-2G + SIM-D4"),
    mainHardwareUid: z.string().trim().max(128).optional(),
    simD4Serial: z.string().trim().max(128).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

const evidenceValueSchema = z.union([
  z.string().max(4000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const hardwareStepEvidenceSchema = z
  .object({
    values: z.record(z.string().min(1).max(80), evidenceValueSchema),
  })
  .strict();

export const hardwareMeasurementSchema = z
  .object({
    stepKey: z.enum(stepKeys),
    channel: z.string().trim().max(80).optional(),
    metricKey: z.string().trim().min(1).max(80),
    numericValue: z.number().finite().optional(),
    textValue: z.string().max(4000).optional(),
    unit: z.string().trim().max(32).optional(),
    observedAt: z.string().datetime().optional(),
  })
  .strict()
  .refine((value) => value.numericValue !== undefined || value.textValue !== undefined, {
    message: "Measurement requires numericValue or textValue",
  });

export const hardwareEventSchema = z
  .object({
    stepKey: z.enum(stepKeys),
    code: z.enum(HARDWARE_FAULT_CODES),
    severity: z.enum(["INFO", "WARNING", "ERROR"]).default("INFO"),
    payload: z.record(z.string(), z.unknown()).default({}),
    observedAt: z.string().datetime().optional(),
  })
  .strict();

export const hardwareFirmwareEvidenceSchema = z
  .object({
    firmwareName: z.string().trim().min(1).max(160),
    firmwareVersion: z.string().trim().min(1).max(80),
    sha256: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{64}$/)
      .optional(),
    sourceCommit: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{40}$/)
      .optional(),
    port: z.string().trim().max(32).optional(),
    flashResult: z.enum(["RECORDED", "PASS", "FAIL"]),
    evidence: z.record(z.string(), z.unknown()).default({}),
    flashedAt: z.string().datetime().optional(),
  })
  .strict();

export type CreateHardwareRunInput = z.infer<typeof createHardwareRunSchema>;
export type HardwareStepEvidenceInput = z.infer<typeof hardwareStepEvidenceSchema>;
export type HardwareMeasurementInput = z.infer<typeof hardwareMeasurementSchema>;
export type HardwareEventInput = z.infer<typeof hardwareEventSchema>;
export type HardwareFirmwareEvidenceInput = z.infer<typeof hardwareFirmwareEvidenceSchema>;
