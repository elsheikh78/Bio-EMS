import { z } from "zod";

export const communicationChannelSchema = z.enum(["EMAIL", "TELEGRAM", "WHATSAPP", "SMS"]);
export type CommunicationChannel = z.infer<typeof communicationChannelSchema>;

const commonSchema = z.object({
  enabled: z.boolean(),
  priority: z.number().int().min(1).max(4),
});

export const communicationChannelConfigSchema = z.discriminatedUnion("channel", [
  commonSchema.extend({
    channel: z.literal("EMAIL"),
    host: z.string().trim().min(1).max(255),
    port: z.number().int().min(1).max(65535),
    security: z.enum(["NONE", "STARTTLS", "TLS"]),
    senderName: z.string().trim().min(1).max(120),
    senderAddress: z.string().trim().email(),
    username: z.string().trim().max(255),
  }),
  commonSchema.extend({
    channel: z.literal("TELEGRAM"),
  }),
  commonSchema.extend({
    channel: z.literal("WHATSAPP"),
    provider: z.literal("META"),
    phoneNumberId: z.string().trim().min(1).max(128),
    businessAccountId: z.string().trim().min(1).max(128),
    senderIdentity: z.string().trim().max(128),
    templateName: z.string().trim().min(1).max(512),
    languageCode: z
      .string()
      .trim()
      .regex(/^[a-z]{2,3}_[A-Z]{2}$/),
  }),
  commonSchema.extend({
    channel: z.literal("SMS"),
    transport: z.enum(["LOCAL_MODEM", "HTTP"]),
    simNumber: z.string().trim().max(32),
    operator: z.string().trim().max(100),
    apn: z.string().trim().max(128),
    comPort: z.string().trim().max(32),
    providerUrl: z.string().trim().url().max(2048).or(z.literal("")),
    providerAccount: z.string().trim().max(255),
  }),
]);

export type CommunicationChannelConfig = z.infer<typeof communicationChannelConfigSchema>;

export const communicationChannelSecretsSchema = z
  .record(z.string(), z.string().min(1).max(8192))
  .refine((value) => Object.keys(value).length > 0, "At least one secret is required");
export type CommunicationChannelSecrets = z.infer<typeof communicationChannelSecretsSchema>;

export const communicationChannelScopeSchema = z.object({
  customerId: z.number().int().positive(),
  siteId: z.number().int().positive().nullable(),
});
export type CommunicationChannelScope = z.infer<typeof communicationChannelScopeSchema>;

export const communicationChannelListQuerySchema = z
  .object({
    siteId: z
      .string()
      .regex(/^[1-9]\d*$/)
      .optional(),
  })
  .strict();

export const communicationChannelParamsSchema = z
  .object({ channel: communicationChannelSchema })
  .strict();

export const platformCommunicationChannelParamsSchema = z
  .object({
    customerId: z.string().regex(/^[1-9]\d*$/),
    channel: communicationChannelSchema,
  })
  .strict();

export const saveCommunicationChannelSchema = z
  .object({
    siteId: z.number().int().positive().nullable(),
    config: communicationChannelConfigSchema,
    secrets: z.record(z.string(), z.string().max(8192)).default({}),
  })
  .strict();

export type SaveCommunicationChannelInput = z.infer<typeof saveCommunicationChannelSchema>;

export const testCommunicationChannelSchema = z
  .object({
    siteId: z.number().int().positive(),
    destination: z.string().trim().min(1).max(512),
  })
  .strict();
