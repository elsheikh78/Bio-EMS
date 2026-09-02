import { z } from "zod";

const code = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const telemetry = z.object({
  code,
  name: z.string().trim().min(1).max(200),
  type: z.enum(["TEMPERATURE", "HUMIDITY", "PRESSURE", "CO2", "DOOR", "OTHER"]),
  unit: z.string().trim().min(1).max(32),
  warningLow: z.number().nullable().optional(), alarmLow: z.number().nullable().optional(),
  warningHigh: z.number().nullable().optional(), alarmHigh: z.number().nullable().optional(),
  warningDelaySeconds: z.number().int().min(0).max(86400).default(0),
  criticalDelaySeconds: z.number().int().min(0).max(86400).default(0),
  calibrationOffset: z.number().default(0),
}).strict();
const area = z.object({
  code, name: z.string().trim().min(1).max(200), description: z.string().trim().max(500).nullable().optional(),
  telemetries: z.array(telemetry).min(1),
}).strict();
const site = z.object({
  code, name: z.string().trim().min(1).max(200), location: z.string().trim().max(300).nullable().optional(),
  timezone: z.string().trim().min(1).max(100), areas: z.array(area).min(1),
}).strict();
const device = z.object({
  deviceId: code, siteCode: code, type: z.string().trim().min(1).max(100), protocol: z.enum(["mqtt", "modbus", "other"]),
  manufacturer: z.string().trim().max(100).nullable().optional(), model: z.string().trim().max(100).nullable().optional(),
  firmwareVersion: z.string().trim().max(100).nullable().optional(),
  mappings: z.array(z.object({ areaCode: code, telemetryCode: code, channel: z.number().int().min(0).max(1023) }).strict()).min(1),
}).strict();

export const installationSnapshotSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  sites: z.array(site).min(1),
  devices: z.array(device).min(1),
}).strict();

export const createInstallationSchema = z.object({ snapshot: installationSnapshotSchema }).strict();
export const reviseInstallationSchema = z.object({
  snapshot: installationSnapshotSchema,
  reason: z.string().trim().min(1).max(1000),
}).strict();
export const installationParamsSchema = z.object({ installationId: z.string().uuid() }).strict();
export const installationListQuerySchema = z.object({ customerId: z.string().regex(/^[1-9]\d*$/).optional() }).strict();
export const installationReceiptSchema = z.object({
  revision: z.number().int().positive(), checksum: z.string().regex(/^[a-f0-9]{64}$/),
  deviceIdentity: z.string().trim().min(1).max(128),
}).strict();
export const installationDecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]), note: z.string().trim().max(1000).nullable().optional(),
}).strict();

export type InstallationSnapshot = z.infer<typeof installationSnapshotSchema>;
