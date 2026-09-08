import { influxDB, org, bucket } from "../client";

export interface RoomTelemetryRecord {
  sensorCode: string;

  sensorType: string;

  deviceCode: string;

  siteCode: string;

  value: number;

  time: string;
}

export interface RoomTelemetryWindowRecord {
  sensorCode: string;

  statistic: "min" | "max" | "trend";

  value: number;

  time: string;
}

const queryApi = influxDB.getQueryApi(org);

export async function getLatestRoomTelemetry(): Promise<RoomTelemetryRecord[]> {
  const fluxQuery = `
from(bucket: "${bucket}")
    |> range(start: -30d)
    |> filter(fn: (r) => r._field == "value")
    |> group(columns: ["_measurement", "sensor"])
    |> last()
`;

  return new Promise((resolve, reject) => {
    const records: RoomTelemetryRecord[] = [];

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);

        records.push({
          sensorCode: String(record.sensor ?? ""),

          sensorType: String(record._measurement ?? ""),

          deviceCode: String(record.device ?? ""),

          siteCode: String(record.site ?? ""),

          value: Number(record._value),

          time: String(record._time),
        });
      },

      error(error) {
        reject(error);
      },

      complete() {
        resolve(records);
      },
    });
  });
}

export function buildRoomTelemetryWindowQuery(bucketName: string): string {
  const safeBucket = JSON.stringify(bucketName);
  return `
base = from(bucket: ${safeBucket})
    |> range(start: -24h)
    |> filter(fn: (r) => r._field == "value")
    |> group(columns: ["_measurement", "sensor"])

minimum = base
    |> min()
    |> set(key: "statistic", value: "min")

maximum = base
    |> max()
    |> set(key: "statistic", value: "max")

trend = base
    |> aggregateWindow(every: 2h, fn: mean, createEmpty: false)
    |> set(key: "statistic", value: "trend")

union(tables: [minimum, maximum, trend])
    |> sort(columns: ["sensor", "_time"])
`;
}

export async function getRoomTelemetryWindow(): Promise<RoomTelemetryWindowRecord[]> {
  const fluxQuery = buildRoomTelemetryWindowQuery(bucket);

  return new Promise((resolve, reject) => {
    const records: RoomTelemetryWindowRecord[] = [];

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);
        const statistic = String(record.statistic);

        if (statistic !== "min" && statistic !== "max" && statistic !== "trend") {
          return;
        }

        const value = Number(record._value);
        if (!Number.isFinite(value)) {
          return;
        }

        records.push({
          sensorCode: String(record.sensor ?? ""),
          statistic,
          value,
          time: String(record._time),
        });
      },

      error(error) {
        reject(error);
      },

      complete() {
        resolve(records);
      },
    });
  });
}
