import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";

export interface AlarmActivationCandidate {
  sensor_id: number;
  alarm_type: string;
  severity: "WARNING" | "CRITICAL";
  first_observed_at: string;
  last_observed_at: string;
  latest_value: number;
}

export class AlarmActivationCandidateRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  find(sensorId: number): AlarmActivationCandidate | undefined {
    return this.database
      .prepare("SELECT * FROM alarm_activation_candidates WHERE sensor_id = ?")
      .get(sensorId) as AlarmActivationCandidate | undefined;
  }

  replace(candidate: AlarmActivationCandidate): void {
    this.database
      .prepare(
        `INSERT INTO alarm_activation_candidates
           (sensor_id, alarm_type, severity, first_observed_at, last_observed_at, latest_value)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(sensor_id) DO UPDATE SET
           alarm_type = excluded.alarm_type,
           severity = excluded.severity,
           first_observed_at = excluded.first_observed_at,
           last_observed_at = excluded.last_observed_at,
           latest_value = excluded.latest_value`
      )
      .run(
        candidate.sensor_id,
        candidate.alarm_type,
        candidate.severity,
        candidate.first_observed_at,
        candidate.last_observed_at,
        candidate.latest_value
      );
  }

  updateObservation(sensorId: number, observedAt: string, value: number): boolean {
    return (
      this.database
        .prepare(
          `UPDATE alarm_activation_candidates
           SET last_observed_at = ?, latest_value = ?
           WHERE sensor_id = ?`
        )
        .run(observedAt, value, sensorId).changes === 1
    );
  }

  delete(sensorId: number): void {
    this.database
      .prepare("DELETE FROM alarm_activation_candidates WHERE sensor_id = ?")
      .run(sensorId);
  }
}
