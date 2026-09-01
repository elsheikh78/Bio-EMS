import { z } from "zod";

const positiveIntegerParam = z.string().regex(/^[1-9]\d*$/);

export const commissioningSiteParamsSchema = z.object({ siteId: positiveIntegerParam }).strict();

export const commissioningSessionParamsSchema = z
  .object({
    siteId: positiveIntegerParam,
    sessionId: positiveIntegerParam,
  })
  .strict();

export const createCommissioningSessionSchema = z
  .object({
    uuid: z.string().trim().min(1),
    controllerIdentity: z.string().trim().min(1).nullable().optional(),
    platformVersion: z.string().trim().min(1),
    commissioningRevision: z.string().trim().min(1),
    witnessIdentity: z.string().trim().min(1).nullable().optional(),
    openedAt: z.string().datetime(),
  })
  .strict();

export const createCommissioningCheckSchema = z
  .object({
    checkKey: z.string().trim().min(1),
    title: z.string().trim().min(1),
    mandatory: z.boolean(),
    physicalOrLiveGate: z.boolean(),
    sensorId: z.number().int().positive().nullable().optional(),
    deviceId: z.number().int().positive().nullable().optional(),
    mapId: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export const appendCommissioningEvidenceSchema = z
  .object({
    checkId: z.number().int().positive(),
    state: z.enum(["NOT_RUN", "PASS", "FAIL", "BLOCKED", "DEFERRED_NON_BLOCKING"]),
    evidenceKind: z.enum(["SOFTWARE_AUTOMATED", "PHYSICAL", "LIVE_PROVIDER", "DOCUMENTARY"]),
    executedAt: z.string().datetime(),
    witnessIdentity: z.string().trim().min(1).nullable().optional(),
    evidenceReference: z.string().trim().min(1).nullable().optional(),
    deviationReference: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export const appendCommissioningDeviationSchema = z
  .object({
    reference: z.string().trim().min(1),
    classification: z.enum(["BLOCKING", "NON_BLOCKING"]),
    description: z.string().trim().min(1),
    recordedAt: z.string().datetime(),
    evidenceReference: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export const appendCommissioningDecisionSchema = z
  .object({
    decision: z.enum(["ACCEPTED", "REJECTED"]),
    decidedAt: z.string().datetime(),
    witnessIdentity: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
  })
  .strict();
