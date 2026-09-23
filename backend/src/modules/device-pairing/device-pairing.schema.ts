import { z } from "zod";

const deviceIdentity = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

export const devicePairingParamsSchema = z
  .object({
    installationId: z.string().uuid(),
    deviceId: deviceIdentity,
  })
  .strict();

export const devicePairingClaimSchema = z
  .object({
    pairing_code: z.string().regex(/^\d{12}$/),
    hardware_uid: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-F0-9]{12,32}$/),
    firmware_version: z.string().trim().min(1).max(64),
    protocol_version: z.string().trim().min(1).max(32),
    binding_schema_version: z.literal(1),
  })
  .strict();

export type DevicePairingClaimInput = z.infer<typeof devicePairingClaimSchema>;
