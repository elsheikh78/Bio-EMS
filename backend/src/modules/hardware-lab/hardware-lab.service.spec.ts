import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration009 } from "../../../database/sqlite/migrations/009_create_platform_principals";
import { migration026 } from "../../../database/sqlite/migrations/026_harden_owner_access";
import { migration031 } from "../../../database/sqlite/migrations/031_create_hardware_qualification_lab";
import { HARDWARE_TEST_STEPS } from "./hardware-lab.profile";
import { HardwareLabService } from "./hardware-lab.service";

describe("HardwareLabService", () => {
  let database: Database.Database;
  let service: HardwareLabService;
  const actor = { principalId: "owner", username: "system-owner" };

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec("PRAGMA foreign_keys = ON; CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    migration009.up(database);
    migration026.up(database);
    migration031.up(database);
    database
      .prepare(
        `INSERT INTO platform_principals(
          id,principal_type,username,password_hash,status
        ) VALUES('owner','SYSTEM_OWNER','system-owner','hash','active')`
      )
      .run();
    service = new HardwareLabService(database, () => new Date("2026-10-06T06:00:00.000Z"));
  });

  afterEach(() => database.close());

  it("publishes the complete ordered Rev.A qualification profile", () => {
    const profile = service.profile();
    expect(profile.steps).toHaveLength(15);
    expect(profile.steps.map((step) => step.order)).toEqual(
      Array.from({ length: 15 }, (_, index) => index)
    );
    expect(profile.steps[0].key).toBe("BENCH_SETUP");
    expect(profile.steps[14].key).toBe("ACCURACY_FINAL");
  });

  it("creates a durable run with every step pending", () => {
    const run = service.create(
      {
        prototypeType: "MAIN-16-2G + SIM-D4",
        mainHardwareUid: "MAIN-01",
        simD4Serial: "SIM-01",
      },
      actor
    );

    expect(run.runNumber).toMatch(/^HQT-2026-/);
    expect(run.status).toBe("NOT_STARTED");
    expect(run.steps).toHaveLength(HARDWARE_TEST_STEPS.length);
    expect(run.steps.every((step) => step.status === "PENDING")).toBe(true);
  });

  it("calculates measurable PASS/FAIL instead of accepting a manual verdict", () => {
    const run = service.create({ prototypeType: "Prototype" }, actor);

    const failed = service.recordStep(
      run.id,
      "SINGLE_SENSOR",
      {
        values: {
          romId: "28-ABC",
          durationMinutes: 30,
          successRatePercent: 98,
          romStable: true,
          resetCount: 1,
          recurringErrors: false,
        },
      },
      actor
    );
    const failedStep = failed.steps.find((step) => step.key === "SINGLE_SENSOR");
    expect(failedStep?.status).toBe("FAIL");
    expect((failedStep?.evaluation as { reasons: string[] }).reasons.length).toBeGreaterThan(0);

    const passed = service.recordStep(
      run.id,
      "SINGLE_SENSOR",
      {
        values: {
          romId: "28-ABC",
          durationMinutes: 60,
          successRatePercent: 99.99,
          romStable: true,
          resetCount: 0,
          recurringErrors: false,
        },
      },
      actor
    );
    expect(passed.steps.find((step) => step.key === "SINGLE_SENSOR")?.status).toBe("PASS");
  });

  it("does not qualify the final gate while prior stages are incomplete", () => {
    const run = service.create({ prototypeType: "Prototype" }, actor);
    const result = service.recordStep(
      run.id,
      "ACCURACY_FINAL",
      {
        values: {
          traceableReferenceUsed: true,
          accuracyWithinApprovedLimit: true,
          calibrationRecorded: true,
        },
      },
      actor
    );

    expect(result.status).toBe("FAILED");
    expect(result.steps.find((step) => step.key === "ACCURACY_FINAL")?.status).toBe("FAIL");
  });

  it("qualifies only after all stages pass and keeps evidence durable", () => {
    const run = service.create({ prototypeType: "Prototype" }, actor);
    database
      .prepare(
        `UPDATE hardware_test_steps
         SET status='PASS',evidence_json='{}',evaluation_json='{"passed":true,"reasons":[]}'
         WHERE run_id=? AND step_order < 14`
      )
      .run(run.id);

    service.addMeasurement(run.id, {
      stepKey: "ENDURANCE_24H",
      channel: "CH1",
      metricKey: "sensor_success_rate",
      numericValue: 99.999,
      unit: "%",
    });
    service.addEvent(run.id, {
      stepKey: "SENSOR_FAULTS",
      code: "MISSING_SENSOR",
      severity: "INFO",
      payload: { channel: "CH1" },
    });
    service.recordFirmware(run.id, "MAIN16_BENCH", {
      firmwareName: "BIOEMS-MAIN16-BENCH",
      firmwareVersion: "0.1.0",
      flashResult: "RECORDED",
      evidence: { verified: true },
    });

    const result = service.recordStep(
      run.id,
      "ACCURACY_FINAL",
      {
        values: {
          traceableReferenceUsed: true,
          accuracyWithinApprovedLimit: true,
          calibrationRecorded: true,
        },
      },
      actor
    );

    expect(result.status).toBe("QUALIFIED");
    expect(result.counts).toEqual({ measurements: 1, events: 1 });
    expect(result.firmware).toHaveLength(1);
    expect(service.report(run.id).acceptance.qualified).toBe(true);
  });
});
