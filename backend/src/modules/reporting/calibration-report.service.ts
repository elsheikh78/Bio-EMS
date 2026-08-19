import { randomBytes } from "node:crypto";
import { AppError } from "../../errors/app-error";
import { CalibrationReportRepository } from "../../repositories/calibration-report.repository";
import type { CalibrationReportPreviewRequest } from "./dto/calibration-report-preview.schema";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function reportId(now: Date): string {
  let timestamp = now.getTime();
  let timePart = "";
  for (let index = 0; index < 10; index += 1) {
    timePart = CROCKFORD[timestamp % 32] + timePart;
    timestamp = Math.floor(timestamp / 32);
  }
  const randomPart = [...randomBytes(16)].map((byte) => CROCKFORD[byte % 32]).join("");
  return `RPT-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${timePart}${randomPart}`;
}

export class CalibrationReportService {
  constructor(
    private readonly repository = new CalibrationReportRepository(),
    private readonly clock: () => Date = () => new Date(),
    private readonly idFactory: (now: Date) => string = reportId
  ) {}

  preview(request: CalibrationReportPreviewRequest) {
    const asOf = this.clock();
    const sensors = this.repository.findSensors(request.sensorUuids);
    const found = new Set(sensors.map((sensor) => sensor.uuid));
    const missingSensorUuids = request.sensorUuids.filter((uuid) => !found.has(uuid));
    if (missingSensorUuids.length > 0) {
      throw new AppError("One or more requested sensors do not exist", 400, "REPORT_SCOPE_INVALID");
    }

    const records = this.repository.findRecords(request.sensorUuids, request.from, request.to);
    const warnings = sensors.flatMap((sensor) => {
      const sensorWarnings: Array<{ code: string; sensorUuid: string }> = [];
      if (!sensor.hardware_model)
        sensorWarnings.push({ code: "MISSING_HARDWARE_MODEL", sensorUuid: sensor.uuid });
      if (sensor.calibration_status !== "NOT_CALIBRATED" && !sensor.certificate_reference) {
        sensorWarnings.push({ code: "MISSING_CERTIFICATE_REFERENCE", sensorUuid: sensor.uuid });
      }
      return sensorWarnings;
    });

    const snapshots = sensors.map((sensor) => ({
      ...sensor,
      dueClassification:
        sensor.calibration_status === "NOT_CALIBRATED" || !sensor.calibration_due_at
          ? "NOT_CALIBRATED"
          : Date.parse(sensor.calibration_due_at) < asOf.getTime()
            ? "OVERDUE"
            : "CURRENT",
    }));

    return {
      identity: {
        reportId: this.idFactory(asOf),
        reportType: request.reportType,
        contractVersion: request.contractVersion,
      },
      scope: {
        sensorUuids: request.sensorUuids,
        from: request.from,
        to: request.to,
        timeZone: request.timeZone,
        language: request.language,
      },
      provenance: {
        generatedAt: asOf.toISOString(),
        source: "SQLITE",
        rangeSemantics: "[from,to)",
      },
      quality: { complete: warnings.length === 0, warnings, unavailableSections: [] },
      summary: {
        sensors: sensors.length,
        records: records.length,
        pass: records.filter((record) => record.result === "PASS").length,
        fail: records.filter((record) => record.result === "FAIL").length,
        overdue: snapshots.filter((sensor) => sensor.dueClassification === "OVERDUE").length,
        notCalibrated: snapshots.filter((sensor) => sensor.dueClassification === "NOT_CALIBRATED")
          .length,
      },
      sensors: snapshots,
      records,
    };
  }
}
