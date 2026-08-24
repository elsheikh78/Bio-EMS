import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import { AuditActorSnapshot, AuditRequestContext } from "../entities/AuditEvent";
import { Sensor } from "../entities/Sensor";
import { UpdateSensorThresholdsInput } from "../modules/sensor/dto/sensor.schema";
import { SENSOR_THRESHOLD_AUDIT_ACTION } from "../modules/sensor/sensor-threshold-audit";
import { SensorRepository, SensorThresholdValues } from "../repositories/sensor.repository";
import { auditEventService, AuditEventService } from "./audit-event.service";

const notFound = () => new AppError("Sensor not found", 404, "SENSOR_NOT_FOUND");
const invalidThresholds = (message: string) => new AppError(message, 400, "VALIDATION_ERROR");

export interface SensorThresholdServiceDependencies {
  repository: SensorRepository;
  auditService: Pick<AuditEventService, "record">;
  runInTransaction: <T>(operation: () => T) => T;
}

export class SensorThresholdService {
  private readonly repository: SensorRepository;
  private readonly auditService: Pick<AuditEventService, "record">;
  private readonly runInTransaction: <T>(operation: () => T) => T;

  constructor(dependencies: Partial<SensorThresholdServiceDependencies> = {}) {
    this.repository = dependencies.repository ?? new SensorRepository();
    this.auditService = dependencies.auditService ?? auditEventService;
    this.runInTransaction =
      dependencies.runInTransaction ?? ((operation) => sqlite.transaction(operation)());
  }

  updateThresholds(
    actor: AuditActorSnapshot,
    sensorUuid: string,
    input: UpdateSensorThresholdsInput,
    requestContext: AuditRequestContext
  ): Sensor {
    let siteId: number | undefined;
    try {
      return this.runInTransaction(() => {
        const context = this.repository.findThresholdContextByUuid(sensorUuid);
        if (!context) throw notFound();
        siteId = context.siteId;

        const previous = thresholdValues(context.sensor);
        const effective = mergeThresholdValues(previous, input);
        validateEffectiveThresholds(context.sensor, effective);

        const updated = this.repository.updateThresholds(sensorUuid, effective);
        if (!updated) throw notFound();

        this.auditService.record({
          actor,
          action: SENSOR_THRESHOLD_AUDIT_ACTION,
          target: { type: "SENSOR", id: sensorUuid },
          siteId,
          result: "SUCCESS",
          previousValues: { ...previous },
          newValues: { ...thresholdValues(updated) },
          requestContext,
        });
        return updated;
      });
    } catch (error) {
      this.recordFailure(actor, sensorUuid, siteId, requestContext, error);
      throw error;
    }
  }

  private recordFailure(
    actor: AuditActorSnapshot,
    sensorUuid: string,
    siteId: number | undefined,
    requestContext: AuditRequestContext,
    error: unknown
  ): void {
    try {
      this.auditService.record({
        actor,
        action: SENSOR_THRESHOLD_AUDIT_ACTION,
        target: { type: "SENSOR", id: sensorUuid },
        siteId,
        result: "FAILED",
        requestContext,
        reason: error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR",
      });
    } catch {
      // Preserve the original failure if best-effort failure evidence cannot persist.
    }
  }
}

export function thresholdValues(sensor: Sensor): SensorThresholdValues {
  return {
    warning_low: sensor.warning_low ?? null,
    alarm_low: sensor.alarm_low ?? null,
    warning_high: sensor.warning_high ?? null,
    alarm_high: sensor.alarm_high ?? null,
  };
}

function mergeThresholdValues(
  previous: SensorThresholdValues,
  input: UpdateSensorThresholdsInput
): SensorThresholdValues {
  return {
    warning_low: input.warning_low === undefined ? previous.warning_low : input.warning_low,
    alarm_low: input.alarm_low === undefined ? previous.alarm_low : input.alarm_low,
    warning_high: input.warning_high === undefined ? previous.warning_high : input.warning_high,
    alarm_high: input.alarm_high === undefined ? previous.alarm_high : input.alarm_high,
  };
}

function validateEffectiveThresholds(sensor: Sensor, values: SensorThresholdValues): void {
  const ordered = [
    ["alarm_low", values.alarm_low],
    ["warning_low", values.warning_low],
    ["warning_high", values.warning_high],
    ["alarm_high", values.alarm_high],
  ] as const;
  const configured: Array<readonly [string, number]> = [];
  for (const [name, value] of ordered) {
    if (value !== null) configured.push([name, value]);
  }

  for (let index = 1; index < configured.length; index += 1) {
    if (configured[index - 1]![1] >= configured[index]![1]) {
      throw invalidThresholds(
        "Configured thresholds must increase from alarm_low through alarm_high"
      );
    }
  }

  for (const [name, value] of configured) {
    if (sensor.min_value !== undefined && sensor.min_value !== null && value < sensor.min_value) {
      throw invalidThresholds(`${name} cannot be below min_value`);
    }
    if (sensor.max_value !== undefined && sensor.max_value !== null && value > sensor.max_value) {
      throw invalidThresholds(`${name} cannot exceed max_value`);
    }
  }
}

export const sensorThresholdService = new SensorThresholdService();
