import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import { AuditActorSnapshot, AuditRequestContext } from "../entities/AuditEvent";
import { Sensor } from "../entities/Sensor";
import { UpdateSensorAlarmDelayInput } from "../modules/sensor/dto/sensor.schema";
import { SENSOR_ALARM_DELAY_AUDIT_ACTION } from "../modules/sensor/sensor-alarm-delay-audit";
import { AlarmActivationCandidateRepository } from "../repositories/alarm-activation-candidate.repository";
import { SensorAlarmDelayValues, SensorRepository } from "../repositories/sensor.repository";
import { auditEventService, AuditEventService } from "./audit-event.service";

const notFound = () => new AppError("Sensor not found", 404, "SENSOR_NOT_FOUND");

interface Dependencies {
  repository: SensorRepository;
  candidates: Pick<AlarmActivationCandidateRepository, "delete">;
  auditService: Pick<AuditEventService, "record">;
  runInTransaction: <T>(operation: () => T) => T;
}

export class SensorAlarmDelayService {
  private readonly dependencies: Dependencies;

  constructor(dependencies: Partial<Dependencies> = {}) {
    this.dependencies = {
      repository: dependencies.repository ?? new SensorRepository(),
      candidates: dependencies.candidates ?? new AlarmActivationCandidateRepository(),
      auditService: dependencies.auditService ?? auditEventService,
      runInTransaction:
        dependencies.runInTransaction ?? ((operation) => sqlite.transaction(operation)()),
    };
  }

  update(
    actor: AuditActorSnapshot,
    sensorUuid: string,
    input: UpdateSensorAlarmDelayInput,
    requestContext: AuditRequestContext
  ): Sensor {
    let siteId: number | undefined;
    try {
      return this.dependencies.runInTransaction(() => {
        const context = this.dependencies.repository.findThresholdContextByUuid(sensorUuid);
        if (!context) throw notFound();
        siteId = context.siteId;
        const previous = delayValues(context.sensor);
        const effective = {
          warning_delay_seconds: input.warning_delay_seconds ?? previous.warning_delay_seconds,
          critical_delay_seconds: input.critical_delay_seconds ?? previous.critical_delay_seconds,
        };
        const updated = this.dependencies.repository.updateAlarmDelay(sensorUuid, effective);
        if (!updated) throw notFound();
        this.dependencies.candidates.delete(context.sensor.id!);
        this.dependencies.auditService.record({
          actor,
          action: SENSOR_ALARM_DELAY_AUDIT_ACTION,
          target: { type: "SENSOR", id: sensorUuid },
          siteId,
          result: "SUCCESS",
          previousValues: { ...previous },
          newValues: { ...delayValues(updated) },
          requestContext,
        });
        return updated;
      });
    } catch (error) {
      try {
        this.dependencies.auditService.record({
          actor,
          action: SENSOR_ALARM_DELAY_AUDIT_ACTION,
          target: { type: "SENSOR", id: sensorUuid },
          siteId,
          result: "FAILED",
          requestContext,
          reason: error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR",
        });
      } catch {
        // Preserve the original failure when best-effort failure evidence cannot persist.
      }
      throw error;
    }
  }
}

export function delayValues(sensor: Sensor): SensorAlarmDelayValues {
  return {
    warning_delay_seconds: sensor.warning_delay_seconds ?? 0,
    critical_delay_seconds: sensor.critical_delay_seconds ?? 0,
  };
}

export const sensorAlarmDelayService = new SensorAlarmDelayService();
