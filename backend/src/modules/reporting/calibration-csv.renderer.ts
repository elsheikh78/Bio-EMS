import type { CalibrationReportService } from "./calibration-report.service";

type Result = ReturnType<CalibrationReportService["preview"]>;

const columns = [
  "report_id",
  "contract_version",
  "generated_at",
  "source",
  "range_from",
  "range_to",
  "time_zone",
  "generated_by",
  "sensor_uuid",
  "sensor_code",
  "sensor_name",
  "site_code",
  "site_name",
  "room_code",
  "room_name",
  "result",
  "performed_at",
  "due_at",
  "offset",
  "certificate_reference",
  "notes",
  "performed_by",
] as const;

function safeCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function renderCalibrationCsv(result: Result, generatedBy: string) {
  const sensorByUuid = new Map(result.sensors.map((sensor) => [sensor.uuid, sensor]));
  const rows = result.records.map((record) => {
    const sensor = sensorByUuid.get(record.sensor_uuid);
    return [
      result.identity.reportId,
      result.identity.contractVersion,
      result.provenance.generatedAt,
      result.provenance.source,
      result.scope.from,
      result.scope.to,
      result.scope.timeZone,
      generatedBy,
      record.sensor_uuid,
      sensor?.code,
      sensor?.name,
      sensor?.site_code,
      sensor?.site_name,
      sensor?.room_code,
      sensor?.room_name,
      record.result,
      record.performed_at,
      record.due_at,
      record.offset,
      record.certificate_reference,
      record.notes,
      record.performed_by_username,
    ];
  });
  const lines = [
    columns.map(safeCell).join(","),
    ...rows.map((row) => row.map(safeCell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function calibrationCsvFilename(result: Result) {
  const from = result.scope.from.slice(0, 10);
  const to = result.scope.to.slice(0, 10);
  return `bio-ems_calibration-history_${from}_${to}_${result.identity.reportId.toLowerCase()}.csv`;
}
