import { z } from "zod";

export const windowsSerialPortSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^COM[1-9]\d{0,2}$/);

const wifiSsidSchema = z
  .string()
  .min(1)
  .max(32)
  .refine((value) => !/[\r\n\t ]/.test(value), {
    message: "Pilot Wi-Fi SSID must not contain whitespace",
  });

const wifiPasswordSchema = z
  .string()
  .min(8)
  .max(63)
  .refine((value) => !/[\r\n]/.test(value), {
    message: "Wi-Fi password must not contain line breaks",
  });

const platformUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(191)
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash &&
          (url.pathname === "/" || url.pathname === "") &&
          !["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase())
        );
      } catch {
        return false;
      }
    },
    {
      message: "Platform URL must be a LAN-reachable HTTPS origin",
    }
  );

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

export const deviceProvisioningFlashBindSchema = z
  .object({
    installationId: z.string().uuid(),
    deviceId: z.string().trim().min(1).max(80),
    port: windowsSerialPortSchema,
    wifiSsid: wifiSsidSchema,
    wifiPassword: wifiPasswordSchema,
    platformUrl: platformUrlSchema,
  })
  .strict();

export const localProvisionerFlashSchema = z
  .object({
    port: windowsSerialPortSchema,
  })
  .strict();

export const deviceProvisioningSimFlashSchema = z
  .object({
    port: windowsSerialPortSchema,
    firmwareVersion: z.string().trim().min(1).max(80),
  })
  .strict();

export const localProvisionerProvisionSchema = z
  .object({
    port: windowsSerialPortSchema,
    wifiSsid: wifiSsidSchema,
    wifiPassword: wifiPasswordSchema,
    platformUrl: platformUrlSchema,
    pairingCode: z.string().regex(/^\d{12}$/),
  })
  .strict();

export const firmwareManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    target: z.literal("esp32s3"),
    model: z.literal("BIO-EMS-SC-V1"),
    firmwareVersion: z.string().min(1),
    protocolVersion: z.string().min(1),
    bindingSchemaVersion: z.literal(1),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    buildSystem: z.literal("ESP-IDF 5.5.5"),
    flash: z
      .object({
        baud: z.number().int().min(115200).max(921600).default(460800),
        mode: z.enum(["dio", "qio", "dout", "qout"]).default("dio"),
        frequency: z
          .string()
          .regex(/^\d+m$/i)
          .default("40m"),
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

export const simScanResultSchema = z
  .object({
    hardwareUid: z.string().regex(/^[a-fA-F0-9]{12,32}$/),
    modules: z
      .array(
        z
          .object({
            address: z.number().int().min(1).max(4),
            responding: z.boolean(),
            inputs: z
              .array(
                z
                  .object({
                    input: z.number().int().min(1).max(4),
                    channel: z.number().int().min(1).max(16),
                    status: z.number().int().nonnegative(),
                    value: z.number().finite().optional(),
                  })
                  .strict()
              )
              .max(4),
          })
          .strict()
      )
      .length(4),
  })
  .strict()
  .superRefine((result, ctx) => {
    result.modules.forEach((module, index) => {
      if (module.address !== index + 1 || module.inputs.length !== (module.responding ? 4 : 0))
        ctx.addIssue({ code: "custom", message: "Invalid SIM scan topology" });
      module.inputs.forEach((input, position) => {
        if (input.input !== position + 1 || input.channel !== index * 4 + position + 1)
          ctx.addIssue({ code: "custom", message: "Invalid SIM input mapping" });
      });
    });
  });
