import type { InstallationContext } from "./contracts";

export const telemetryTypes = [
  "TEMPERATURE",
  "HUMIDITY",
  "PRESSURE",
  "CO2",
  "DOOR",
  "OTHER",
] as const;

export type TelemetryType = (typeof telemetryTypes)[number];

export type DraftTelemetry = {
  code: string;
  name: string;
  type: TelemetryType;
  unit: string;
  deviceId: string;
  channel: number;
};

export type DraftArea = {
  code: string;
  name: string;
  telemetries: DraftTelemetry[];
};

export type DraftDevice = {
  deviceId: string;
};

export type InstallationBuilderSnapshot = {
  companyName: string;
  sites: Array<{
    code: string;
    name: string;
    location?: string;
    timezone: string;
    areas: Array<{
      code: string;
      name: string;
      telemetries: Array<{
        code: string;
        name: string;
        type: TelemetryType;
        unit: string;
        warningDelaySeconds: number;
        criticalDelaySeconds: number;
        calibrationOffset: number;
      }>;
    }>;
  }>;
  devices: Array<{
    deviceId: string;
    siteCode: string;
    type: string;
    protocol: "mqtt";
    manufacturer: string;
    model: string;
    firmwareVersion: string;
    mappings: Array<{
      areaCode: string;
      telemetryCode: string;
      channel: number;
    }>;
  }>;
};

function nextCode(prefix: string, width: number, values: string[]) {
  const used = new Set(values);
  for (let index = 1; index < 10000; index += 1) {
    const candidate = `${prefix}${String(index).padStart(width, "0")}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("No identifier is available");
}

export function nextAreaCode(areas: DraftArea[]) {
  return nextCode(
    "A",
    2,
    areas.map((area) => area.code),
  );
}

export function nextTelemetryCode(areas: DraftArea[]) {
  return nextCode(
    "S",
    1,
    areas.flatMap((area) =>
      area.telemetries.map((telemetry) => telemetry.code),
    ),
  );
}

export function nextDeviceCode(devices: DraftDevice[]) {
  return nextCode(
    "D",
    3,
    devices.map((device) => device.deviceId),
  );
}

export function defaultUnit(type: TelemetryType) {
  if (type === "TEMPERATURE") return "°C";
  if (type === "HUMIDITY") return "%RH";
  if (type === "PRESSURE") return "Pa";
  if (type === "CO2") return "ppm";
  if (type === "DOOR") return "state";
  return "unit";
}

export function nextChannel(areas: DraftArea[], deviceId: string) {
  const used = new Set(
    areas.flatMap((area) =>
      area.telemetries
        .filter((telemetry) => telemetry.deviceId === deviceId)
        .map((telemetry) => telemetry.channel),
    ),
  );
  let channel = 1;
  while (used.has(channel)) channel += 1;
  return channel;
}

export function validBuilder(areas: DraftArea[], devices: DraftDevice[]) {
  if (areas.length === 0 || devices.length === 0) return false;
  if (areas.some((area) => !area.name.trim() || area.telemetries.length === 0))
    return false;

  const mappedByDevice = new Map<string, number>();
  const channelsByDevice = new Map<string, Set<number>>();

  for (const area of areas) {
    for (const telemetry of area.telemetries) {
      if (
        !telemetry.name.trim() ||
        !telemetry.unit.trim() ||
        !devices.some((device) => device.deviceId === telemetry.deviceId) ||
        !Number.isInteger(telemetry.channel) ||
        telemetry.channel < 1
      ) {
        return false;
      }

      mappedByDevice.set(
        telemetry.deviceId,
        (mappedByDevice.get(telemetry.deviceId) ?? 0) + 1,
      );
      const channels =
        channelsByDevice.get(telemetry.deviceId) ?? new Set<number>();
      if (channels.has(telemetry.channel)) return false;
      channels.add(telemetry.channel);
      channelsByDevice.set(telemetry.deviceId, channels);
    }
  }

  return devices.every(
    (device) => (mappedByDevice.get(device.deviceId) ?? 0) > 0,
  );
}

export function buildSnapshot(
  context: InstallationContext,
  areas: DraftArea[],
  devices: DraftDevice[],
): InstallationBuilderSnapshot {
  return {
    companyName: context.customer.name,
    sites: [
      {
        code: context.site.code,
        name: context.site.name,
        ...(context.site.location ? { location: context.site.location } : {}),
        timezone: context.site.timezone ?? "Africa/Cairo",
        areas: areas.map((area) => ({
          code: area.code,
          name: area.name.trim(),
          telemetries: area.telemetries.map((telemetry) => ({
            code: telemetry.code,
            name: telemetry.name.trim(),
            type: telemetry.type,
            unit: telemetry.unit.trim(),
            warningDelaySeconds: 0,
            criticalDelaySeconds: 0,
            calibrationOffset: 0,
          })),
        })),
      },
    ],
    devices: devices.map((device) => ({
      deviceId: device.deviceId,
      siteCode: context.site.code,
      type: "zone-controller",
      protocol: "mqtt",
      manufacturer: "BIO-EMS",
      model: "BIO-EMS-SC-V1",
      firmwareVersion: "0.1.0-pilot.1",
      mappings: areas.flatMap((area) =>
        area.telemetries
          .filter((telemetry) => telemetry.deviceId === device.deviceId)
          .map((telemetry) => ({
            areaCode: area.code,
            telemetryCode: telemetry.code,
            channel: telemetry.channel,
          })),
      ),
    })),
  };
}
