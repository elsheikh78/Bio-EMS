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
  warningLow?: number;
  alarmLow?: number;
  warningHigh?: number;
  alarmHigh?: number;
  warningDelaySeconds: number;
  criticalDelaySeconds: number;
  calibrationOffset: number;
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
        warningLow?: number;
        alarmLow?: number;
        warningHigh?: number;
        alarmHigh?: number;
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


export function builderStateFromSnapshot(
  snapshot: Record<string, unknown> | undefined,
  siteCode: string,
): { areas: DraftArea[]; devices: DraftDevice[] } {
  if (!snapshot) return { areas: [], devices: [{ deviceId: "D001" }] };

  const rawDevices = Array.isArray(snapshot.devices) ? snapshot.devices : [];
  const deviceRecords = rawDevices.filter(
    (value): value is Record<string, unknown> =>
      Boolean(value) && typeof value === "object",
  );
  const devices = deviceRecords
    .filter((device) => device.siteCode === siteCode)
    .flatMap((device) =>
      typeof device.deviceId === "string" && device.deviceId.length > 0
        ? [{ deviceId: device.deviceId }]
        : [],
    );

  const mappingByTelemetry = new Map<
    string,
    { deviceId: string; channel: number }
  >();
  for (const device of deviceRecords) {
    if (
      device.siteCode !== siteCode ||
      typeof device.deviceId !== "string" ||
      !Array.isArray(device.mappings)
    ) {
      continue;
    }
    for (const mapping of device.mappings) {
      if (!mapping || typeof mapping !== "object") continue;
      const row = mapping as Record<string, unknown>;
      if (
        typeof row.areaCode === "string" &&
        typeof row.telemetryCode === "string" &&
        typeof row.channel === "number"
      ) {
        mappingByTelemetry.set(
          `${row.areaCode}/${row.telemetryCode}`,
          { deviceId: device.deviceId, channel: row.channel },
        );
      }
    }
  }

  const rawSites = Array.isArray(snapshot.sites) ? snapshot.sites : [];
  const site = rawSites.find(
    (value): value is Record<string, unknown> =>
      Boolean(value) &&
      typeof value === "object" &&
      (value as Record<string, unknown>).code === siteCode,
  );
  const rawAreas = site && Array.isArray(site.areas) ? site.areas : [];
  const fallbackDevice = devices[0]?.deviceId ?? "";

  const areas: DraftArea[] = rawAreas.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const area = value as Record<string, unknown>;
    if (typeof area.code !== "string" || typeof area.name !== "string") {
      return [];
    }
    const rawTelemetries = Array.isArray(area.telemetries)
      ? area.telemetries
      : [];
    const telemetries: DraftTelemetry[] = rawTelemetries.flatMap(
      (telemetryValue) => {
        if (!telemetryValue || typeof telemetryValue !== "object") return [];
        const telemetry = telemetryValue as Record<string, unknown>;
        if (
          typeof telemetry.code !== "string" ||
          typeof telemetry.name !== "string"
        ) {
          return [];
        }
        const mapping = mappingByTelemetry.get(
          `${area.code}/${telemetry.code}`,
        );
        const rawType =
          typeof telemetry.type === "string" ? telemetry.type : "OTHER";
        const type = telemetryTypes.includes(rawType as TelemetryType)
          ? (rawType as TelemetryType)
          : "OTHER";
        return [
          {
            code: telemetry.code,
            name: telemetry.name,
            type,
            unit:
              typeof telemetry.unit === "string"
                ? telemetry.unit
                : defaultUnit(type),
            deviceId: mapping?.deviceId ?? fallbackDevice,
            channel: mapping?.channel ?? 1,
            ...(typeof telemetry.warningLow === "number"
              ? { warningLow: telemetry.warningLow }
              : {}),
            ...(typeof telemetry.alarmLow === "number"
              ? { alarmLow: telemetry.alarmLow }
              : {}),
            ...(typeof telemetry.warningHigh === "number"
              ? { warningHigh: telemetry.warningHigh }
              : {}),
            ...(typeof telemetry.alarmHigh === "number"
              ? { alarmHigh: telemetry.alarmHigh }
              : {}),
            warningDelaySeconds:
              typeof telemetry.warningDelaySeconds === "number"
                ? telemetry.warningDelaySeconds
                : 0,
            criticalDelaySeconds:
              typeof telemetry.criticalDelaySeconds === "number"
                ? telemetry.criticalDelaySeconds
                : 0,
            calibrationOffset:
              typeof telemetry.calibrationOffset === "number"
                ? telemetry.calibrationOffset
                : 0,
          },
        ];
      },
    );
    return [{ code: area.code, name: area.name, telemetries }];
  });

  return {
    areas,
    devices: devices.length > 0 ? devices : [{ deviceId: "D001" }],
  };
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
            ...(telemetry.warningLow !== undefined
              ? { warningLow: telemetry.warningLow }
              : {}),
            ...(telemetry.alarmLow !== undefined
              ? { alarmLow: telemetry.alarmLow }
              : {}),
            ...(telemetry.warningHigh !== undefined
              ? { warningHigh: telemetry.warningHigh }
              : {}),
            ...(telemetry.alarmHigh !== undefined
              ? { alarmHigh: telemetry.alarmHigh }
              : {}),
            warningDelaySeconds: telemetry.warningDelaySeconds,
            criticalDelaySeconds: telemetry.criticalDelaySeconds,
            calibrationOffset: telemetry.calibrationOffset,
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
