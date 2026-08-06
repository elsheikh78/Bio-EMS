import { influxDB, org, bucket } from "../client";

export interface LatestTelemetryRecord {
  time: string;

  site: string;

  device: string;

  sensor: string;

  sensorType: string;

  unit: string;

  value: number;
}

const queryApi = influxDB.getQueryApi(org);

export async function getLatestTelemetry(limit = 100): Promise<LatestTelemetryRecord[]> {
  const fluxQuery = `
        from(bucket: "${bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "temperature")
            |> filter(fn: (r) => r._field == "value")
            |> group(columns: ["sensor"])
            |> last()
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: ${limit})
    `;

  const rows = await queryApi.collectRows(fluxQuery);

  return rows.map((row: any) => ({
    time: row._time,

    site: row.site,

    device: row.device,

    sensor: row.sensor,

    sensorType: row._measurement,

    unit: row.unit,

    value: row._value,
  }));
}
