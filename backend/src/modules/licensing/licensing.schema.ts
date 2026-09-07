import { z } from "zod";

const hardwareFingerprintSchema = z
  .object({
    schemaVersion: z.literal(1),
    componentHashes: z.record(z.string(), z.string()),
    compositeHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export const activationRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    installationId: z.string().uuid(),
    customerId: z.number().int().positive(),
    siteId: z.number().int().positive(),
    publicKeyPem: z.string().includes("PUBLIC KEY").max(4096),
    hardwareFingerprint: hardwareFingerprintSchema,
    requestedAt: z.string().datetime(),
  })
  .strict();

export const activationDecisionSchema = z
  .object({
    licenseId: z.string().uuid(),
    licenseType: z.enum(["TRIAL", "SUBSCRIPTION", "PERPETUAL"]),
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    maintenanceUntil: z.string().datetime().nullable(),
    updateEntitlement: z.enum(["NONE", "FREE", "PAID"]),
    modules: z.array(z.string().trim().min(1).max(64)).min(1),
    maximumGateways: z.number().int().nonnegative().nullable(),
    maximumDevices: z.number().int().nonnegative().nullable(),
    maximumSensors: z.number().int().nonnegative().nullable(),
    offlineGraceSeconds: z.number().int().nonnegative(),
  })
  .strict();

export const activationParamsSchema = z.object({ requestId: z.string().uuid() }).strict();
export type ActivationRequest = z.infer<typeof activationRequestSchema>;
export type ActivationDecision = z.infer<typeof activationDecisionSchema>;
