import { z } from "zod";

const nonNegativeInteger = z.number().int().nonnegative();
const finiteNumber = z.number().finite();

export const dashboardSummarySchema = z
  .object({
    totalSites: nonNegativeInteger,
    totalRooms: nonNegativeInteger,
    totalDevices: nonNegativeInteger,
    totalSensors: nonNegativeInteger,
    activeAlarms: nonNegativeInteger,
    onlineDevices: nonNegativeInteger,
    staleDevices: nonNegativeInteger,
    offlineDevices: nonNegativeInteger,
    neverSeenDevices: nonNegativeInteger,
    notOperationalDevices: nonNegativeInteger,
  })
  .strict()
  .superRefine((summary, context) => {
    const classifiedDevices =
      summary.onlineDevices +
      summary.staleDevices +
      summary.offlineDevices +
      summary.neverSeenDevices +
      summary.notOperationalDevices;

    if (classifiedDevices !== summary.totalDevices) {
      context.addIssue({
        code: "custom",
        message: "Device communication counts must equal totalDevices",
      });
    }
  });

export const dashboardSensorStatusSchema = z.enum([
  "NORMAL",
  "WARNING",
  "CRITICAL",
  "UNKNOWN",
]);

export const dashboardRoomStatusSchema = z
  .object({
    roomId: nonNegativeInteger,
    roomName: z.string(),
    siteId: nonNegativeInteger,
    siteName: z.string(),
    temperature: finiteNumber.nullable(),
    humidity: finiteNumber.nullable(),
    temperatureStatus: dashboardSensorStatusSchema,
    humidityStatus: dashboardSensorStatusSchema,
    activeAlarms: nonNegativeInteger,
    online: z.boolean(),
    lastUpdate: z.string().nullable(),
  })
  .strict();

export const dashboardRoomStatusesSchema = z.array(dashboardRoomStatusSchema);

export const dashboardAlarmStatisticsSchema = z
  .object({
    active: nonNegativeInteger,
    acknowledged: nonNegativeInteger,
    recovered: nonNegativeInteger,
    critical: nonNegativeInteger,
    warning: nonNegativeInteger,
    info: nonNegativeInteger,
  })
  .strict();

export const latestTelemetryRecordSchema = z
  .object({
    time: z.string(),
    site: z.string(),
    device: z.string(),
    sensor: z.string(),
    sensorType: z.string(),
    unit: z.string(),
    value: finiteNumber,
  })
  .strict();

export const latestTelemetrySchema = z.array(latestTelemetryRecordSchema);

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export type DashboardSensorStatus = z.infer<typeof dashboardSensorStatusSchema>;

export type DashboardRoomStatus = z.infer<typeof dashboardRoomStatusSchema>;

export type DashboardAlarmStatistics = z.infer<
  typeof dashboardAlarmStatisticsSchema
>;

export type LatestTelemetryRecord = z.infer<typeof latestTelemetryRecordSchema>;
