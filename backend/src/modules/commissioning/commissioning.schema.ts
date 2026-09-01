import { z } from "zod";

export const commissioningSiteParamsSchema = z
  .object({ siteId: z.coerce.number().int().positive() })
  .strict();

export const commissioningSessionParamsSchema = z
  .object({
    siteId: z.coerce.number().int().positive(),
    sessionId: z.coerce.number().int().positive(),
  })
  .strict();

export const createCommissioningSessionSchema = z
  .object({
    uuid: z.string().trim().min(1),
    controllerIdentity: z.string().trim().min(1).nullable().optional(),
    platformVersion: z.string().trim().min(1),
    commissioningRevision: z.string().trim().min(1),
    engineerIdentity: z.string().trim().min(1),
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
    actorIdentity: z.string().trim().min(1),
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
    actorIdentity: z.string().trim().min(1),
    evidenceReference: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export const appendCommissioningDecisionSchema = z
  .object({
    decision: z.enum(["ACCEPTED", "REJECTED"]),
    decidedAt: z.string().datetime(),
    actorIdentity: z.string().trim().min(1),
    witnessIdentity: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
    snapshot: z.unknown(),
  })
  .strict();
