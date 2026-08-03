import { SiteRepository } from "../repositories/site.repository";
import { RoomRepository } from "../repositories/room.repository";
import { DeviceRepository } from "../repositories/device.repository";
import { SensorRepository } from "../repositories/sensor.repository";
import { AlarmRepository } from "../repositories/alarm.repository";
import { AlarmStatistics } from "../types/alarm-statistics.types";
import { DashboardSummary } from "../types/dashboard.types";
import { getLatestTelemetry } from "../../database/influx/queries/telemetry.query";
import { RoomStatus } from "../types/room-status.types";
import { getLatestRoomTelemetry } from "../../database/influx/queries/room-status.query";

interface SensorSnapshot {

    value: number;

    time: string;

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

                online: true

            };

            aggregates.set(room.id, aggregate);

        }

        aggregate.sensors.set(

            record.sensorType,

            {

                value: record.value,

                time: record.time

            }

        );

    }

    return Array.from(aggregates.values()).map(room => {

        const temperature = room.sensors.get("temperature");

        const humidity = room.sensors.get("humidity");

        return {

            roomId: room.roomId,

            roomName: room.roomName,

            siteId: room.siteId,

            siteName: room.siteName,

            temperature: temperature?.value ?? null,

            humidity: humidity?.value ?? null,

            temperatureStatus: temperature ? "NORMAL" : "UNKNOWN",

            humidityStatus: humidity ? "NORMAL" : "UNKNOWN",

            activeAlarms: room.activeAlarms,

            online: room.online,

            lastUpdate: temperature?.time ?? humidity?.time ?? null

        };

    });

}
    
async getAlarmStatistics(): Promise<AlarmStatistics> {

    const alarms = this.alarmRepository.getAll();

    return {

        active: alarms.filter(a => a.status === "TRIGGERED").length,

        acknowledged: alarms.filter(a => a.status === "ACKNOWLEDGED").length,

        recovered: alarms.filter(a => a.status === "RECOVERED").length,

        critical: alarms.filter(a => a.severity === "CRITICAL").length,

        warning: alarms.filter(a => a.severity === "WARNING").length,

        info: alarms.filter(a => a.severity === "INFO").length

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

const offlineDevices = devices.filter(device =>
    device.status?.toLowerCase() === "offline"
);

        return {

            totalSites: sites.length,

            totalRooms: rooms.length,

            totalDevices: devices.length,

            totalSensors: sensors.length,

            activeAlarms: activeAlarms.length,

            offlineDevices: offlineDevices.length

        };

    }

}