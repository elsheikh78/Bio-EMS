import { z } from "zod";

export const hardwareEvidenceValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const hardwareRuleSchema = z.union([
  z.object({ kind: z.literal("boolean"), expected: z.boolean() }).strict(),
  z.object({ kind: z.literal("number-min"), value: z.number() }).strict(),
  z.object({ kind: z.literal("number-max"), value: z.number() }).strict(),
  z.object({ kind: z.literal("number-equals"), value: z.number() }).strict(),
  z.object({ kind: z.literal("string-equals"), value: z.string() }).strict(),
  z.object({ kind: z.literal("non-empty") }).strict(),
]);

export const hardwareFieldSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "number", "boolean", "choice"]),
    required: z.boolean(),
    unit: z.string().optional(),
    options: z
      .array(z.object({ value: z.string(), label: z.string() }).strict())
      .optional(),
    help: z.string().optional(),
    rule: hardwareRuleSchema.optional(),
  })
  .strict();

export const hardwareStepDefinitionSchema = z
  .object({
    key: z.string(),
    order: z.number().int().nonnegative(),
    title: z.string(),
    stage: z.string(),
    instructions: z.array(z.string()),
    expectedDurationMinutes: z.number().positive().optional(),
    fields: z.array(hardwareFieldSchema),
    acceptanceNote: z.string().optional(),
  })
  .strict();

export const hardwareFirmwareCatalogItemSchema = z
  .object({
    target: z.enum(["MAIN16_BENCH", "SIMD4_BENCH", "SITE_CONTROLLER_PILOT"]),
    name: z.string(),
    device: z.string(),
    purpose: z.string(),
    availability: z.enum(["SOURCE_REQUIRED", "DEVICE_PROVISIONING"]),
  })
  .strict();

export const hardwareProfileSchema = z
  .object({
    revision: z.string(),
    faultCodes: z.array(z.string()),
    firmwareCatalog: z.array(hardwareFirmwareCatalogItemSchema),
    steps: z.array(hardwareStepDefinitionSchema),
  })
  .strict();

export const hardwareStepResultSchema = z
  .object({
    key: z.string(),
    order: z.number().int().nonnegative(),
    status: z.enum(["PENDING", "PASS", "FAIL"]),
    evidence: z.record(z.string(), hardwareEvidenceValueSchema),
    evaluation: z.unknown(),
    recordedBy: z.string().nullable(),
    recordedAt: z.string().nullable(),
  })
  .strict();

export const hardwareFirmwareRecordSchema = z
  .object({
    target: z.string(),
    firmwareName: z.string(),
    firmwareVersion: z.string(),
    sha256: z.string().nullable(),
    sourceCommit: z.string().nullable(),
    port: z.string().nullable(),
    flashResult: z.enum(["RECORDED", "PASS", "FAIL"]),
    evidence: z.unknown(),
    evidenceJson: z.undefined().optional(),
    flashedAt: z.string(),
  })
  .passthrough();

export const hardwareRunSchema = z
  .object({
    id: z.string().uuid(),
    runNumber: z.string(),
    profileRevision: z.string(),
    prototypeType: z.string(),
    status: z.enum(["NOT_STARTED", "TESTING", "QUALIFIED", "FAILED"]),
    mainHardwareUid: z.string().nullable(),
    simD4Serial: z.string().nullable(),
    operatorPrincipalId: z.string(),
    operatorUsername: z.string(),
    mainFirmwareVersion: z.string().nullable(),
    simFirmwareVersion: z.string().nullable(),
    mainFirmwareSha256: z.string().nullable(),
    simFirmwareSha256: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().nullable(),
    steps: z.array(hardwareStepResultSchema),
    firmware: z.array(hardwareFirmwareRecordSchema),
    counts: z
      .object({
        measurements: z.number().int().nonnegative(),
        events: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const hardwareRunListItemSchema = z
  .object({
    id: z.string().uuid(),
    runNumber: z.string(),
    profileRevision: z.string(),
    prototypeType: z.string(),
    status: z.enum(["NOT_STARTED", "TESTING", "QUALIFIED", "FAILED"]),
    mainHardwareUid: z.string().nullable(),
    simD4Serial: z.string().nullable(),
    operatorUsername: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().nullable(),
    passedSteps: z.number().int().nonnegative(),
    failedSteps: z.number().int().nonnegative(),
    totalSteps: z.number().int().positive(),
  })
  .strict();

export const hardwareRunListSchema = z
  .object({ runs: z.array(hardwareRunListItemSchema) })
  .strict();

export const hardwareMeasurementRecordSchema = z
  .object({
    id: z.number().int().positive(),
    stepKey: z.string(),
    channel: z.string().nullable(),
    metricKey: z.string(),
    numericValue: z.number().nullable(),
    textValue: z.string().nullable(),
    unit: z.string().nullable(),
    observedAt: z.string(),
  })
  .strict();

export const hardwareMeasurementListSchema = z
  .object({ measurements: z.array(hardwareMeasurementRecordSchema) })
  .strict();

export const hardwareEventRecordSchema = z
  .object({
    id: z.number().int().positive(),
    stepKey: z.string(),
    code: z.string(),
    severity: z.enum(["INFO", "WARNING", "ERROR"]),
    payload: z.unknown(),
    payloadJson: z.undefined().optional(),
    observedAt: z.string(),
  })
  .passthrough();

export const hardwareEventListSchema = z
  .object({ events: z.array(hardwareEventRecordSchema) })
  .strict();

export const hardwareReportSchema = z
  .object({
    generatedAt: z.string(),
    decision: z.enum(["NOT_STARTED", "TESTING", "QUALIFIED", "FAILED"]),
    run: hardwareRunSchema,
    acceptance: z
      .object({
        requiredSteps: z.number().int().positive(),
        passedSteps: z.number().int().nonnegative(),
        failedSteps: z.number().int().nonnegative(),
        pendingSteps: z.number().int().nonnegative(),
        qualified: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type HardwareProfile = z.infer<typeof hardwareProfileSchema>;
export type HardwareRun = z.infer<typeof hardwareRunSchema>;
export type HardwareRunListItem = z.infer<typeof hardwareRunListItemSchema>;
export type HardwareEvidenceValue = z.infer<typeof hardwareEvidenceValueSchema>;
export type HardwareStepDefinition = z.infer<
  typeof hardwareStepDefinitionSchema
>;
export type HardwareMeasurementRecord = z.infer<
  typeof hardwareMeasurementRecordSchema
>;
export type HardwareEventRecord = z.infer<typeof hardwareEventRecordSchema>;
