import { z } from "zod";

export const windowsSerialPortSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^COM[1-9]\d{0,2}$/);

export const deviceProvisioningDetectSchema = z
  .object({
    port: windowsSerialPortSchema,
  })
  .strict();

export const deviceProvisioningFlashSchema = z
  .object({
    installationId: z.string().uuid(),
    deviceId: z.string().trim().min(1).max(80),
    port: windowsSerialPortSchema,
  })
  .strict();

export const localProvisionerFlashSchema = z
  .object({
    port: windowsSerialPortSchema,
  })
  .strict();

export const firmwareManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    target: z.literal("esp32s3"),
    firmwareVersion: z.string().min(1),
    protocolVersion: z.string().min(1),
    bindingSchemaVersion: z.literal(1),
    flash: z
      .object({
        baud: z.number().int().min(115200).max(921600).default(460800),
        mode: z.enum(["dio", "qio", "dout", "qout"]).default("dio"),
        frequency: z.string().regex(/^\d+m$/i).default("40m"),
        size: z.string().min(1).default("detect"),
      })
      .strict(),
    segments: z
      .array(
        z
          .object({
            offset: z.string().regex(/^0x[0-9a-f]+$/i),
            file: z.string().min(1),
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .strict()
      )
      .min(1),
  })
  .strict();

export type FirmwareManifest = z.infer<typeof firmwareManifestSchema>;
