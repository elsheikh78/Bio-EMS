import { influxDB, org, bucket } from "../client";

export interface RoomTelemetryRecord {
  sensorCode: string;

  sensorType: string;

  deviceCode: string;

  siteCode: string;

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
