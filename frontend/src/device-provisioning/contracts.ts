import { z } from "zod";

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
        .strict()
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

export type DeviceProvisioningPort = z.infer<
  typeof deviceProvisioningPortsSchema
>["ports"][number];
export type DetectedDevice = z.infer<typeof detectedDeviceSchema>;
