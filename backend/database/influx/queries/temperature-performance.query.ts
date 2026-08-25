import { influxDB, org, bucket } from "../client";

export interface TemperaturePerformanceQuery {
  sensorCode: string;
  from: string;
  to: string;
}

export interface TemperaturePerformanceSummary {
  sensor: string;
  unit: string;
  count: number;
  minimum: number | null;
  maximum: number | null;
  average: number | null;
  firstReadingAt: string | null;
  lastReadingAt: string | null;
}

const queryApi = influxDB.getQueryApi(org);

export async function getTemperaturePerformanceSummary(
  query: TemperaturePerformanceQuery,
): Promise<TemperaturePerformanceSummary | null> {
  const fluxQuery = `
    data =
      from(bucket: "${bucket}")
        |> range(
          start: time(v: "${query.from}"),
          stop: time(v: "${query.to}")
        )
        |> filter(fn: (r) =>
          r._measurement == "temperature" and
          r._field == "value" and
          r.sensor == "${query.sensorCode}"
        )

    summary =
      data
        |> group()
        |> reduce(
          identity: {
            count: 0,
            minimum: 0.0,
            maximum: 0.0,
            total: 0.0
          },
          fn: (r, accumulator) => ({
            count: accumulator.count + 1,
            minimum:
              if accumulator.count == 0 then r._value
              else if r._value < accumulator.minimum then r._value
              else accumulator.minimum,
            maximum:
              if accumulator.count == 0 then r._value
              else if r._value > accumulator.maximum then r._value
              else accumulator.maximum,
            total: accumulator.total + r._value,
          }),
        )

    firstReading =
      data
        |> first()

    lastReading =
      data
        |> last()

    union(
      tables: [
        summary,
        firstReading,
        lastReading,
      ],
    )
  `;

  const rows = (await queryApi.collectRows(
    fluxQuery,
  )) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return null;
  }

  const summaryRow =
    rows.find((row) => row.count !== undefined) ?? {};

  const timeRows = rows.filter((row) => row._time !== undefined);

  const firstRow = timeRows[0] ?? null;

  const lastRow =
    timeRows.length > 0
      ? timeRows[timeRows.length - 1]
      : null;

  const count = Number(summaryRow.count ?? 0);

  return {
    sensor: query.sensorCode,

    unit:
      typeof summaryRow.unit === "string"
        ? summaryRow.unit
        : "°C",

    count,

    minimum:
      summaryRow.minimum !== undefined
        ? Number(summaryRow.minimum)
        : null,

    maximum:
      summaryRow.maximum !== undefined
        ? Number(summaryRow.maximum)
        : null,

    average:
      count > 0
        ? Number(summaryRow.total) / count
        : null,

    firstReadingAt:
      typeof firstRow?._time === "string"
        ? firstRow._time
        : null,

    lastReadingAt:
      typeof lastRow?._time === "string"
        ? lastRow._time
        : null,
  };
}