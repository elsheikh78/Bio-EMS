import { SiteRepository } from "../repositories/site.repository";
import { RoomRepository } from "../repositories/room.repository";
import { DeviceRepository } from "../repositories/device.repository";
import { Sensor, SensorRepository } from "../repositories/sensor.repository";
import { summarizeDeviceCommunicationStatuses } from "./device-health.service";
import { AlarmRepository } from "../repositories/alarm.repository";
import { AlarmStatistics } from "../types/alarm-statistics.types";
import { DashboardSummary } from "../types/dashboard.types";
import { getLatestTelemetry } from "../../database/influx/queries/telemetry.query";
import { RoomStatus } from "../types/room-status.types";
import { getLatestRoomTelemetry } from "../../database/influx/queries/room-status.query";
import { evaluateAlarm } from "../domain/engines/alarm-evaluation.engine";
import { AlarmStatus } from "../domain/enums/alarm-status";
import { SensorType } from "../domain/enums/sensor-type";

export interface SensorSnapshot {
  value: number;

  time: string;

  sensor: Sensor;
}

const ROOM_STATUS_PRIORITY: Record<RoomStatus["temperatureStatus"], number> = {
  UNKNOWN: 0,
  NORMAL: 1,
  WARNING: 2,
  CRITICAL: 3,
};

export function shouldReplaceRoomSnapshot(
  currentStatus: RoomStatus["temperatureStatus"],
  candidateStatus: RoomStatus["temperatureStatus"],
  currentTime: string,
  candidateTime: string
): boolean {
  const priorityDifference =
    ROOM_STATUS_PRIORITY[candidateStatus] - ROOM_STATUS_PRIORITY[currentStatus];

  return priorityDifference > 0 || (priorityDifference === 0 && candidateTime > currentTime);
}

interface RoomAggregate {
  roomId: number;

  roomName: string;

  siteId: number;

  siteName: string;

  sensors: Map<string, SensorSnapshot>;

  activeAlarms: number;

  online: boolean;
}
export class DashboardService {
  private readonly siteRepository = new SiteRepository();
  private readonly roomRepository = new RoomRepository();
  private readonly deviceRepository = new DeviceRepository();
  private readonly sensorRepository = new SensorRepository();
  private readonly alarmRepository = new AlarmRepository();
  private buildRoomMap() {
    const map = new Map<number, ReturnType<RoomRepository["findById"]>>();

    for (const room of this.roomRepository.getAll()) {
      if (room.id !== undefined) {
        map.set(room.id, room);
      }
    }

    return map;
  }

  private buildSiteMap() {
    const map = new Map<number, ReturnType<SiteRepository["findById"]>>();

    for (const site of this.siteRepository.getAll()) {
      if (site.id !== undefined) {
        map.set(site.id, site);
      }
    }

    return map;
  }

  private buildSensorMap() {
    const map = new Map<string, ReturnType<SensorRepository["findByCode"]>>();

    for (const sensor of this.sensorRepository.getAll()) {
      map.set(sensor.code, sensor);
    }

    return map;
  }

  async getRoomStatus(): Promise<RoomStatus[]> {
    const telemetry = await getLatestRoomTelemetry();

    const sensorMap = this.buildSensorMap();

    const roomMap = this.buildRoomMap();

    const siteMap = this.buildSiteMap();

    const aggregates = new Map<number, RoomAggregate>();

    for (const record of telemetry) {
      const sensor = sensorMap.get(record.sensorCode);

      if (!sensor) {
        continue;
      }

      const room = roomMap.get(sensor.room_id);

      if (!room || room.id === undefined) {
        continue;
      }

      const site = siteMap.get(room.site_id);

      let aggregate = aggregates.get(room.id);

      if (!aggregate) {
        aggregate = {
          roomId: room.id,

          roomName: room.name,

          siteId: room.site_id,

          siteName: site?.name ?? "",

          sensors: new Map(),

          activeAlarms: 0,

          online: true,
        };

        aggregates.set(room.id, aggregate);
      }

      const sensorType = record.sensorType.toLowerCase();
      const candidate: SensorSnapshot = {
        value: record.value,
        time: record.time,
        sensor,
      };
      const current = aggregate.sensors.get(sensorType);

      if (
        !current ||
        shouldReplaceRoomSnapshot(
          this.evaluateSensorStatus(current),
          this.evaluateSensorStatus(candidate),
          current.time,
          candidate.time
        )
      ) {
        aggregate.sensors.set(sensorType, candidate);
      }
    }

    const sensorsById = new Map(
      this.sensorRepository
        .getAll()
        .filter((sensor) => sensor.id !== undefined)
        .map((sensor) => [sensor.id!, sensor])
    );

    for (const alarm of this.alarmRepository.getActive()) {
      const sensor = sensorsById.get(alarm.sensor_id);
      const aggregate = sensor ? aggregates.get(sensor.room_id) : undefined;

      if (aggregate) {
        aggregate.activeAlarms += 1;
      }
    }

    return Array.from(aggregates.values()).map((room) => {
      const temperature = room.sensors.get("temperature");

      const humidity = room.sensors.get("humidity");

      return {
        roomId: room.roomId,

        roomName: room.roomName,

        siteId: room.siteId,

        siteName: room.siteName,

        temperature: temperature?.value ?? null,

        humidity: humidity?.value ?? null,

        temperatureStatus: this.evaluateSensorStatus(temperature),

        humidityStatus: this.evaluateSensorStatus(humidity),

        activeAlarms: room.activeAlarms,

        online: room.online,

        lastUpdate: temperature?.time ?? humidity?.time ?? null,
      };
    });
  }

  private evaluateSensorStatus(
    snapshot: SensorSnapshot | undefined
  ): RoomStatus["temperatureStatus"] {
    if (!snapshot) {
      return this.mapAlarmStatus(AlarmStatus.UNKNOWN);
    }

    const result = evaluateAlarm(
      {
        sensorType: snapshot.sensor.sensor_type.toUpperCase() as SensorType,
        value: snapshot.value,
      },
      {
        warningLow: snapshot.sensor.warning_low,
        alarmLow: snapshot.sensor.alarm_low,
        warningHigh: snapshot.sensor.warning_high,
        alarmHigh: snapshot.sensor.alarm_high,
      }
    );

    return this.mapAlarmStatus(result.status);
  }

  private mapAlarmStatus(status: AlarmStatus): RoomStatus["temperatureStatus"] {
    switch (status) {
      case AlarmStatus.NORMAL:
        return "NORMAL";

      case AlarmStatus.WARNING_LOW:
      case AlarmStatus.WARNING_HIGH:
        return "WARNING";

      case AlarmStatus.CRITICAL_LOW:
      case AlarmStatus.CRITICAL_HIGH:
        return "CRITICAL";

      case AlarmStatus.UNKNOWN:
        return "UNKNOWN";
    }
  }

  async getAlarmStatistics(): Promise<AlarmStatistics> {
    const alarms = this.alarmRepository.getAll();

    return {
      active: alarms.filter((a) => a.status === "TRIGGERED").length,

      acknowledged: alarms.filter((a) => a.status === "ACKNOWLEDGED").length,

      recovered: alarms.filter((a) => a.status === "RECOVERED").length,

      critical: alarms.filter((a) => a.severity === "CRITICAL").length,

      warning: alarms.filter((a) => a.severity === "WARNING").length,

      info: alarms.filter((a) => a.severity === "INFO").length,
    };
  }

  async getLatestTelemetry() {
    return await getLatestTelemetry();
  }

  async getSummary(): Promise<DashboardSummary> {
    const sites = this.siteRepository.getAll();
    const rooms = this.roomRepository.getAll();
    const devices = this.deviceRepository.getAll();
    const sensors = this.sensorRepository.getAll();
    const activeAlarms = this.alarmRepository.getActive();

    const communication = summarizeDeviceCommunicationStatuses(devices);

    return {
      totalSites: sites.length,

      totalRooms: rooms.length,

      totalDevices: devices.length,

      totalSensors: sensors.length,

      activeAlarms: activeAlarms.length,
      onlineDevices: communication.ONLINE,
      staleDevices: communication.STALE,
      offlineDevices: communication.OFFLINE,
      neverSeenDevices: communication.NEVER_SEEN,
      notOperationalDevices: communication.NOT_OPERATIONAL,
    };
  }
}
