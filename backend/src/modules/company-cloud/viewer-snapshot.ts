import { getLatestRoomTelemetry } from "../../../database/influx/queries/room-status.query";
import { installationContextService } from "../installation/installation-context.service";
import { SensorRepository } from "../../repositories/sensor.repository";
import { RoomRepository } from "../../repositories/room.repository";
import { ViewerExportRepository } from "../../repositories/viewer-export.repository";

const MAX_SENSORS = 500;
const MAX_ALARMS = 1000;
const MAX_ROOMS = 250;
const DAY_MS = 86_400_000;

export async function buildViewerSnapshot(now = Date.now()) {
  const { site, installationId } = installationContextService.current();
  const rooms = new RoomRepository()
    .getAll()
    .filter((r) => r.site_id === site.id && r.active !== 0);
  if (rooms.length > MAX_ROOMS) throw new Error("Viewer export room limit exceeded");
  const roomIds = new Set(rooms.map((r) => r.id));
  const sensors = new SensorRepository()
    .getAll()
    .filter((s) => roomIds.has(s.room_id) && s.enabled !== 0);
  if (sensors.length > MAX_SENSORS) throw new Error("Viewer export sensor limit exceeded");
  let telemetryAvailable = true;
  const readings = await getLatestRoomTelemetry().catch(() => {
    telemetryAvailable = false;
    return [];
  });
  const latest = new Map(
    readings
      .filter((r) => r.siteCode === site.code)
      .map((r) => [`${r.sensorCode}:${r.sensorType.toLowerCase()}`, r])
  );
  const sensorById = new Map(sensors.map((s) => [s.id, s]));
  const records = new ViewerExportRepository().recentAlarms(
    site.id,
    new Date(now - DAY_MS).toISOString().replace("T", " ").slice(0, 19)
  );
  if (records.length > MAX_ALARMS) throw new Error("Viewer export alarm limit exceeded");
  const alarms = records
    .filter((a) => sensorById.has(a.sensor_id))
    .map((a) => ({
      id: `${installationId}:${a.id}:${a.trigger_time}`,
      sensorId: String(a.sensor_id),
      roomId: String(sensorById.get(a.sensor_id)!.room_id),
      type: a.type,
      severity: a.severity,
      status: a.status,
      value: Number.isFinite(a.trigger_value) ? a.trigger_value : null,
      triggeredAt: utc(a.trigger_time),
      recoveredAt: utc(a.recovered_time),
    }));
  return {
    schemaVersion: 1,
    capturedAt: new Date(now).toISOString(),
    telemetryAvailable,
    rooms: rooms.map((r) => ({ id: String(r.id), name: r.name, code: r.code })),
    sensors: sensors.map((s) => {
      const reading = latest.get(`${s.code}:${s.sensor_type.toLowerCase()}`);
      const valid =
        reading && Number.isFinite(reading.value) && Number.isFinite(Date.parse(reading.time));
      return {
        id: String(s.id),
        roomId: String(s.room_id),
        name: s.name,
        code: s.code,
        type: s.sensor_type,
        unit: s.unit,
        value: valid ? reading.value : null,
        recordedAt: valid ? new Date(reading.time).toISOString() : null,
      };
    }),
    alarms,
  };
}
function utc(value: string | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}
