import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration031 } from "../../../database/sqlite/migrations/031_create_hardware_qualification_lab";
import { HardwareLabRepository } from "./hardware-lab.repository";

describe("HardwareLabRepository", () => {
  let database: Database.Database;
  const now = "2026-10-06T08:00:00.000Z";

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec("PRAGMA foreign_keys = ON");
    migration031.up(database);
  });

  afterEach(() => database.close());

  it("creates the full ordered qualification sequence", () => {
    const repository = new HardwareLabRepository(database, () => now);
    const created = repository.createRun(
      { prototype_type: "MAIN16_SIMD4", main_hardware_uid: "MAIN-01", sim_serial: "SIM-01" },
      "system-owner#owner"
    );

    expect(created?.run).toMatchObject({
      prototype_type: "MAIN16_SIMD4",
      status: "SETUP",
      main_hardware_uid: "MAIN-01",
      sim_serial: "SIM-01",
    });
    expect(created?.steps).toHaveLength(15);
    expect(created?.steps[0]).toMatchObject({ step_code: "BENCH_SETUP", sequence: 0 });
    expect(created?.steps[14]).toMatchObject({
      step_code: "ACCURACY_CALIBRATION",
      sequence: 14,
    });
  });

  it("blocks out-of-order execution", () => {
    const repository = new HardwareLabRepository(database, () => now);
    const created = repository.createRun({ prototype_type: "MAIN16_SIMD4" }, "owner");

    expect(() =>
      repository.startStep((created!.run as { id: string }).id, "SENSOR_SINGLE")
    ).toThrow("PREVIOUS_STEP_NOT_PASSED");
  });

  it("automatically fails the cable gate below 99.99 percent", () => {
    const repository = new HardwareLabRepository(database, () => now);
    const created = repository.createRun({ prototype_type: "MAIN16_SIMD4" }, "owner");
    const runId = (created!.run as { id: string }).id;

    repository.recordStepResult(runId, "BENCH_SETUP", { status: "PASS", metrics: [] });
    repository.recordStepResult(runId, "POWER_RAILS", { status: "PASS", metrics: [] });
    repository.recordStepResult(runId, "SENSOR_SINGLE", { status: "PASS", metrics: [] });

    const result = repository.recordStepResult(runId, "SENSOR_CABLE", {
      status: "PASS",
      metrics: [{ key: "success_rate_percent", value_real: 99.98, unit: "%" }],
    });

    expect(result?.evaluation).toEqual({
      status: "FAIL",
      reason: "Successful-read rate is below 99.99%",
    });
  });

  it("requires zero unexplained reboots and unrecovered faults for endurance", () => {
    const repository = new HardwareLabRepository(database, () => now);
    const created = repository.createRun({ prototype_type: "MAIN16_SIMD4" }, "owner");
    const runId = (created!.run as { id: string }).id;

    for (const step of (created!.steps as Array<{ step_code: string }>).slice(0, 11)) {
      repository.recordStepResult(runId, step.step_code, {
        status: "PASS",
        metrics:
          step.step_code === "SENSOR_CABLE"
            ? [{ key: "success_rate_percent", value_real: 100 }]
            : [],
      });
    }

    const result = repository.recordStepResult(runId, "ENDURANCE_24H", {
      status: "PASS",
      metrics: [
        { key: "unexplained_reboots", value_real: 1 },
        { key: "unrecovered_faults", value_real: 0 },
      ],
    });

    expect(result?.evaluation.status).toBe("FAIL");
  });

  it("finalizes PASS only when every step and both bench firmware targets pass", () => {
    const repository = new HardwareLabRepository(database, () => now);
    const created = repository.createRun({ prototype_type: "MAIN16_SIMD4" }, "owner");
    const runId = (created!.run as { id: string }).id;

    for (const step of created!.steps as Array<{ step_code: string }>) {
      const metrics =
        step.step_code === "SENSOR_CABLE"
          ? [{ key: "success_rate_percent", value_real: 100 }]
          : step.step_code === "ENDURANCE_24H" || step.step_code === "SYSTEM_16_SENSOR_48H"
            ? [
                { key: "unexplained_reboots", value_real: 0 },
                { key: "unrecovered_faults", value_real: 0 },
              ]
            : [];
      repository.recordStepResult(runId, step.step_code, { status: "PASS", metrics });
    }

    repository.recordFirmware(runId, {
      target: "MAIN16",
      firmware_name: "BIOEMS-MAIN16-BENCH",
      version: "0.1.0",
      chip: "ESP32-S3",
      flash_status: "PASS",
    });
    repository.recordFirmware(runId, {
      target: "SIMD4",
      firmware_name: "BIOEMS-SIMD4-BENCH",
      version: "0.1.0",
      chip: "ATmega328P",
      flash_status: "PASS",
    });

    expect(repository.finalizeRun(runId)?.run).toMatchObject({ status: "PASS" });
  });
});
