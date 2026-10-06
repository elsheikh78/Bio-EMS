import { z } from "zod";

export const hardwareLabStepSchema = z
  .object({
    run_id: z.string().uuid(),
    step_code: z.string(),
    sequence: z.number().int().nonnegative(),
    title: z.string(),
    execution_mode: z.enum(["AUTO", "MANUAL", "HYBRID"]),
    status: z.enum(["PENDING", "RUNNING", "PASS", "FAIL", "SKIPPED"]),
    acceptance_rule: z.string(),
    started_at: z.string().nullable(),
    completed_at: z.string().nullable(),
    notes: z.string().nullable(),
    metrics_json: z.string().nullable(),
  })
  .passthrough();

export const hardwareLabRunRowSchema = z
  .object({
    id: z.string().uuid(),
    run_code: z.string(),
    prototype_type: z.literal("MAIN16_SIMD4"),
    status: z.enum(["NOT_STARTED", "SETUP", "FLASHING", "TESTING", "ENDURANCE", "PASS", "FAIL"]),
    operator: z.string(),
    main_hardware_uid: z.string().nullable(),
    sim_serial: z.string().nullable(),
    hardware_profile_rev: z.string(),
    test_profile_rev: z.string(),
    notes: z.string().nullable(),
    created_at: z.string(),
    started_at: z.string().nullable(),
    completed_at: z.string().nullable(),
    updated_at: z.string(),
  })
  .passthrough();

export const hardwareLabFirmwareEvidenceSchema = z
  .object({
    id: z.number().int(),
    run_id: z.string().uuid(),
    target: z.enum(["MAIN16", "SIMD4", "SITE_CONTROLLER"]),
    firmware_name: z.string(),
    version: z.string(),
    git_commit: z.string().nullable(),
    sha256: z.string().nullable(),
    chip: z.string(),
    port: z.string().nullable(),
    flash_status: z.enum(["PENDING", "PASS", "FAIL"]),
    tool_output: z.string().nullable(),
    recorded_at: z.string(),
  })
  .passthrough();

export const hardwareLabMeasurementSchema = z
  .object({
    id: z.number().int(),
    run_id: z.string().uuid(),
    step_code: z.string(),
    metric_key: z.string(),
    value_real: z.number().nullable(),
    value_text: z.string().nullable(),
    unit: z.string().nullable(),
    channel: z.string().nullable(),
    recorded_at: z.string(),
  })
  .passthrough();

export const hardwareLabEventSchema = z
  .object({
    id: z.number().int(),
    run_id: z.string().uuid(),
    step_code: z.string().nullable(),
    event_code: z.string(),
    expected: z.string().nullable(),
    observed: z.string().nullable(),
    severity: z.enum(["INFO", "WARNING", "ERROR"]),
    recorded_at: z.string(),
  })
  .passthrough();

export const hardwareLabRunDetailSchema = z
  .object({
    run: hardwareLabRunRowSchema,
    steps: z.array(hardwareLabStepSchema),
    firmware: z.array(hardwareLabFirmwareEvidenceSchema),
    measurements: z.array(hardwareLabMeasurementSchema),
    events: z.array(hardwareLabEventSchema),
    evaluation: z
      .object({ status: z.enum(["PASS", "FAIL"]), reason: z.string().optional() })
      .optional(),
  })
  .passthrough();

export const hardwareLabRunsSchema = z.object({ runs: z.array(hardwareLabRunRowSchema) }).strict();

export const hardwareLabProfileSchema = z
  .object({
    hardware_profile_rev: z.string(),
    test_profile_rev: z.string(),
    sensor_success_rate_percent: z.number(),
    fault_codes: z.array(z.string()),
    firmware: z.array(
      z
        .object({
          target: z.enum(["MAIN16", "SIMD4", "SITE_CONTROLLER"]),
          name: z.string(),
          chip: z.string(),
          purpose: z.string(),
          requiredForPhysicalQualification: z.boolean(),
        })
        .strict(),
    ),
    steps: z.array(
      z
        .object({
          code: z.string(),
          sequence: z.number().int(),
          title: z.string(),
          executionMode: z.enum(["AUTO", "MANUAL", "HYBRID"]),
          acceptanceRule: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export type HardwareLabRun = z.infer<typeof hardwareLabRunRowSchema>;
export type HardwareLabRunDetail = z.infer<typeof hardwareLabRunDetailSchema>;
export type HardwareLabStep = z.infer<typeof hardwareLabStepSchema>;
