import { z } from "zod";

export const simFlashingHealthSchema = z
  .object({
    toolReady: z.boolean(),
    firmwareReady: z.boolean(),
    firmwareVersion: z.string().nullable(),
  })
  .strict();
export const simFlashingResultSchema = z
  .object({
    port: z.string(),
    firmwareVersion: z.string(),
    toolOutput: z.string(),
  })
  .strict();

export const deviceProvisionerHealthSchema = z
  .object({
    status: z.literal("UP"),
    target: z.literal("ESP32-S3"),
    esptoolReady: z.boolean(),
    firmwareReady: z.boolean(),
  })
  .strict();

export const deviceProvisioningPortsSchema = z
  .object({
    ports: z.array(
      z
        .object({
          port: z.string().regex(/^COM[1-9]\d{0,2}$/),
          name: z.string().nullable(),
          pnpDeviceId: z.string().nullable(),
          manufacturer: z.string().nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export const detectedDeviceSchema = z
  .object({
    port: z.string().regex(/^COM[1-9]\d{0,2}$/),
    chip: z.string().nullable(),
    supported: z.boolean(),
    toolOutput: z.string(),
  })
  .strict();

export const deviceProvisioningTargetsSchema = z
  .object({
    targets: z.array(
      z
        .object({
          installationId: z.string().uuid(),
          customerName: z.string().min(1),
          revision: z.number().int().positive(),
          devices: z.array(
            z
              .object({
                deviceId: z.string().min(1),
                siteCode: z.string().min(1),
                siteName: z.string().min(1),
                model: z.string().nullable(),
                firmwareVersion: z.string().nullable(),
                bound: z.boolean(),
                hardwareUid: z.string().nullable(),
                platformBindingId: z.string().uuid().nullable(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict();

export const flashBindResultSchema = z
  .object({
    port: z.string().regex(/^COM[1-9]\d{0,2}$/),
    installationId: z.string().uuid(),
    deviceId: z.string().min(1),
    siteCode: z.string().min(1),
    hardwareUid: z.string().min(12),
    platformBindingId: z.string().uuid(),
    firmwareVersion: z.string().min(1),
    protocolVersion: z.string().min(1),
    bindingSchemaVersion: z.literal(1),
    recoveredExistingBinding: z.boolean(),
    allDevicesBound: z.boolean(),
    installationStatus: z.string().min(1),
  })
  .strict();

export type DeviceProvisioningPort = z.infer<
  typeof deviceProvisioningPortsSchema
>["ports"][number];
export type DetectedDevice = z.infer<typeof detectedDeviceSchema>;
export type DeviceProvisioningTarget = z.infer<
  typeof deviceProvisioningTargetsSchema
>["targets"][number];
export type FlashBindResult = z.infer<typeof flashBindResultSchema>;

export const simDetectionSchema = z
  .object({
    port: z.string(),
    supported: z.boolean(),
    chip: z.string().nullable(),
    baud: z.number().int().nullable(),
  })
  .strict();
export const simScanSchema = z
  .object({
    port: z.string(),
    hardwareUid: z.string(),
    modules: z.array(
      z
        .object({
          address: z.number().int().min(1).max(4),
          responding: z.boolean(),
          inputs: z.array(
            z
              .object({
                input: z.number().int(),
                channel: z.number().int(),
                status: z.number().int(),
                value: z.number().optional(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict();
