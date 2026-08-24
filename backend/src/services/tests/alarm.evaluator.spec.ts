import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { migration011 } from "../../../database/sqlite/migrations/011_add_alarm_delay_configuration";
import { AlarmActivationCandidateRepository } from "../../repositories/alarm-activation-candidate.repository";
import { AlarmEvaluator, AlarmCheckInput } from "../alarm.evaluator";

const warningHigh: AlarmCheckInput = {
  sensorId: 1,
  sensorName: "Temperature",
  sensorType: "TEMPERATURE",
  value: 9,
  warningHigh: 8,
  alarmHigh: 10,
  warningDelaySeconds: 30,
  criticalDelaySeconds: 10,
};

describe("configured Alarm activation persistence", () => {
  let database: Database.Database;
  let candidates: AlarmActivationCandidateRepository;
  let currentTime: Date;
  let createAlarm: ReturnType<typeof vi.fn>;
  let getActiveAlarm: ReturnType<typeof vi.fn>;
  let recoverAlarm: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec("CREATE TABLE sensors (id INTEGER PRIMARY KEY)");
    migration011.up(database);
    database.prepare("INSERT INTO sensors (id) VALUES (1)").run();
    candidates = new AlarmActivationCandidateRepository(database);
    currentTime = new Date("2026-08-24T10:00:00.000Z");
    createAlarm = vi.fn(() => 41);
    getActiveAlarm = vi.fn(() => undefined);
    recoverAlarm = vi.fn();
  });

  afterEach(() => database.close());

  const evaluator = () =>
    new AlarmEvaluator({
      candidates,
      createAlarm,
      getActiveAlarm,
      recoverAlarm,
      now: () => currentTime,
    });

  it("preserves immediate legacy activation when the effective delay is zero", () => {
    evaluator().evaluate({ ...warningHigh, warningDelaySeconds: 0 });

    expect(createAlarm).toHaveBeenCalledOnce();
    expect(candidates.find(1)).toBeUndefined();
  });

  it("persists a candidate across evaluator recreation and activates at the boundary", () => {
    evaluator().evaluate(warningHigh);
    expect(createAlarm).not.toHaveBeenCalled();
    expect(candidates.find(1)).toMatchObject({
      alarm_type: "HIGH_TEMPERATURE",
      severity: "WARNING",
      first_observed_at: "2026-08-24T10:00:00.000Z",
    });

    currentTime = new Date("2026-08-24T10:00:29.999Z");
    evaluator().evaluate(warningHigh);
    expect(createAlarm).not.toHaveBeenCalled();

    currentTime = new Date("2026-08-24T10:00:30.000Z");
    evaluator().evaluate({ ...warningHigh, value: 9.5 });
    expect(createAlarm).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "WARNING", trigger_value: 9.5 })
    );
    expect(candidates.find(1)).toBeUndefined();
  });

  it("clears persistence when the Sensor returns to normal", () => {
    evaluator().evaluate(warningHigh);
    evaluator().evaluate({ ...warningHigh, value: 5 });

    expect(candidates.find(1)).toBeUndefined();
    expect(createAlarm).not.toHaveBeenCalled();
  });

  it("restarts persistence when direction or severity changes", () => {
    evaluator().evaluate(warningHigh);
    currentTime = new Date("2026-08-24T10:00:20.000Z");
    evaluator().evaluate({
      ...warningHigh,
      value: -1,
      warningLow: 2,
      alarmLow: 0,
    });
    expect(candidates.find(1)).toMatchObject({
      alarm_type: "LOW_TEMPERATURE",
      severity: "CRITICAL",
      first_observed_at: "2026-08-24T10:00:20.000Z",
    });
    expect(createAlarm).not.toHaveBeenCalled();
  });
});
