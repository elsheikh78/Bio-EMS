import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import {
  HARDWARE_PROFILE_REV,
  TEST_PROFILE_REV,
  hardwareLabSteps,
} from "./hardware-lab.profile";

export interface HardwareMetricInput {
  key: string;
  value_real?: number;
  value_text?: string;
  unit?: string;
  channel?: string;
}

export interface HardwareStepResultInput {
  status: "PASS" | "FAIL";
  notes?: string;
  metrics: HardwareMetricInput[];
}

export interface HardwareFirmwareInput {
  target: "MAIN16" | "SIMD4" | "SITE_CONTROLLER";
  firmware_name: string;
  version: string;
  git_commit?: string;
  sha256?: string;
  chip: string;
  port?: string;
  flash_status: "PENDING" | "PASS" | "FAIL";
  tool_output?: string;
}

export interface HardwareEventInput {
  step_code?: string;
  event_code: string;
  expected?: string;
  observed?: string;
  severity: "INFO" | "WARNING" | "ERROR";
}

const isoNow = () => new Date().toISOString();

function createRunCode(now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `HQT-${stamp}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function metricNumber(metrics: HardwareMetricInput[], key: string): number | undefined {
  return metrics.find((metric) => metric.key === key)?.value_real;
}

function evaluateStep(
  stepCode: string,
  requested: "PASS" | "FAIL",
  metrics: HardwareMetricInput[]
): { status: "PASS" | "FAIL"; reason?: string } {
  if (requested === "FAIL") return { status: "FAIL" };

  if (stepCode === "SENSOR_CABLE") {
    const successRate = metricNumber(metrics, "success_rate_percent");
    if (successRate === undefined) {
      return { status: "FAIL", reason: "success_rate_percent is required for SENSOR_CABLE" };
    }
    if (successRate < 99.99) {
      return { status: "FAIL", reason: "Successful-read rate is below 99.99%" };
    }
  }

  if (stepCode === "ENDURANCE_24H" || stepCode === "SYSTEM_16_SENSOR_48H") {
    const unexplainedReboots = metricNumber(metrics, "unexplained_reboots");
    const unrecoveredFaults = metricNumber(metrics, "unrecovered_faults");
    if (unexplainedReboots === undefined || unrecoveredFaults === undefined) {
      return {
        status: "FAIL",
        reason: "unexplained_reboots and unrecovered_faults are required for endurance gates",
      };
    }
    if (unexplainedReboots > 0 || unrecoveredFaults > 0) {
      return { status: "FAIL", reason: "Endurance gate recorded a reboot or unrecovered fault" };
    }
  }

  return { status: "PASS" };
}

export class HardwareLabRepository {
  constructor(
    private readonly database: Database.Database = sqlite,
    private readonly now: () => string = isoNow
  ) {}

  createRun(
    input: {
      prototype_type: "MAIN16_SIMD4";
      main_hardware_uid?: string;
      sim_serial?: string;
      notes?: string;
    },
    operator: string
  ) {
    const id = randomUUID();
    const timestamp = this.now();
    const runCode = createRunCode(new Date(timestamp));

    this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO hardware_test_runs (
            id, run_code, prototype_type, status, operator, main_hardware_uid, sim_serial,
            hardware_profile_rev, test_profile_rev, notes, created_at, started_at, updated_at
          ) VALUES (?, ?, ?, 'SETUP', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          runCode,
          input.prototype_type,
          operator,
          input.main_hardware_uid ?? null,
          input.sim_serial ?? null,
          HARDWARE_PROFILE_REV,
          TEST_PROFILE_REV,
          input.notes ?? null,
          timestamp,
          timestamp,
          timestamp
        );

      const insertStep = this.database.prepare(
        `INSERT INTO hardware_test_steps (
          run_id, step_code, sequence, title, execution_mode, status, acceptance_rule
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`
      );
      for (const step of hardwareLabSteps) {
        insertStep.run(
          id,
          step.code,
          step.sequence,
          step.title,
          step.executionMode,
          step.acceptanceRule
        );
      }
    })();

    return this.getRun(id);
  }

  listRuns(limit = 50) {
    return this.database
      .prepare(
        `SELECT id, run_code, prototype_type, status, operator, main_hardware_uid, sim_serial,
                hardware_profile_rev, test_profile_rev, notes, created_at, started_at,
                completed_at, updated_at
         FROM hardware_test_runs
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(Math.max(1, Math.min(200, limit)));
  }

  getRun(runId: string) {
    const run = this.database.prepare("SELECT * FROM hardware_test_runs WHERE id = ?").get(runId);
    if (!run) return undefined;
    return {
      run,
      steps: this.database
        .prepare(
          `SELECT * FROM hardware_test_steps WHERE run_id = ? ORDER BY sequence ASC`
        )
        .all(runId),
      firmware: this.database
        .prepare(
          `SELECT * FROM hardware_test_firmware WHERE run_id = ? ORDER BY recorded_at DESC, id DESC`
        )
        .all(runId),
      measurements: this.database
        .prepare(
          `SELECT * FROM hardware_test_measurements WHERE run_id = ? ORDER BY recorded_at ASC, id ASC`
        )
        .all(runId),
      events: this.database
        .prepare(
          `SELECT * FROM hardware_test_events WHERE run_id = ? ORDER BY recorded_at ASC, id ASC`
        )
        .all(runId),
    };
  }

  startStep(runId: string, stepCode: string) {
    const timestamp = this.now();
    const step = this.database
      .prepare("SELECT sequence, status FROM hardware_test_steps WHERE run_id = ? AND step_code = ?")
      .get(runId, stepCode) as { sequence: number; status: string } | undefined;
    if (!step) return undefined;
    if (step.status === "PASS") return this.getRun(runId);

    const earlierFailure = this.database
      .prepare(
        `SELECT step_code FROM hardware_test_steps
         WHERE run_id = ? AND sequence < ? AND status <> 'PASS'
         ORDER BY sequence ASC LIMIT 1`
      )
      .get(runId, step.sequence);
    if (earlierFailure) {
      throw new Error("PREVIOUS_STEP_NOT_PASSED");
    }

    const runStatus =
      stepCode === "ENDURANCE_24H" || stepCode === "SYSTEM_16_SENSOR_48H"
        ? "ENDURANCE"
        : "TESTING";

    this.database.transaction(() => {
      this.database
        .prepare(
          `UPDATE hardware_test_steps
           SET status = 'RUNNING', started_at = COALESCE(started_at, ?), completed_at = NULL
           WHERE run_id = ? AND step_code = ?`
        )
        .run(timestamp, runId, stepCode);
      this.database
        .prepare("UPDATE hardware_test_runs SET status = ?, updated_at = ? WHERE id = ?")
        .run(runStatus, timestamp, runId);
    })();

    return this.getRun(runId);
  }

  recordStepResult(runId: string, stepCode: string, input: HardwareStepResultInput) {
    const step = this.database
      .prepare("SELECT step_code FROM hardware_test_steps WHERE run_id = ? AND step_code = ?")
      .get(runId, stepCode);
    if (!step) return undefined;

    const evaluation = evaluateStep(stepCode, input.status, input.metrics);
    const timestamp = this.now();
    const notes = [input.notes, evaluation.reason].filter(Boolean).join("\n") || null;

    this.database.transaction(() => {
      this.database
        .prepare(
          "DELETE FROM hardware_test_measurements WHERE run_id = ? AND step_code = ?"
        )
        .run(runId, stepCode);

      const insertMetric = this.database.prepare(
        `INSERT INTO hardware_test_measurements (
          run_id, step_code, metric_key, value_real, value_text, unit, channel, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const metric of input.metrics) {
        insertMetric.run(
          runId,
          stepCode,
          metric.key,
          metric.value_real ?? null,
          metric.value_text ?? null,
          metric.unit ?? null,
          metric.channel ?? null,
          timestamp
        );
      }

      this.database
        .prepare(
          `UPDATE hardware_test_steps
           SET status = ?, completed_at = ?, notes = ?, metrics_json = ?
           WHERE run_id = ? AND step_code = ?`
        )
        .run(
          evaluation.status,
          timestamp,
          notes,
          JSON.stringify(input.metrics),
          runId,
          stepCode
        );

      this.database
        .prepare(
          `UPDATE hardware_test_runs
           SET status = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(evaluation.status === "FAIL" ? "FAIL" : "TESTING", timestamp, runId);
    })();

    return { ...this.getRun(runId), evaluation };
  }

  recordFirmware(runId: string, input: HardwareFirmwareInput) {
    if (!this.database.prepare("SELECT id FROM hardware_test_runs WHERE id = ?").get(runId)) {
      return undefined;
    }
    const timestamp = this.now();
    this.database
      .prepare(
        `INSERT INTO hardware_test_firmware (
          run_id, target, firmware_name, version, git_commit, sha256, chip, port,
          flash_status, tool_output, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        runId,
        input.target,
        input.firmware_name,
        input.version,
        input.git_commit ?? null,
        input.sha256 ?? null,
        input.chip,
        input.port ?? null,
        input.flash_status,
        input.tool_output ?? null,
        timestamp
      );

    this.database
      .prepare(
        "UPDATE hardware_test_runs SET status = 'FLASHING', updated_at = ? WHERE id = ? AND status <> 'PASS'"
      )
      .run(timestamp, runId);
    return this.getRun(runId);
  }

  recordEvent(runId: string, input: HardwareEventInput) {
    if (!this.database.prepare("SELECT id FROM hardware_test_runs WHERE id = ?").get(runId)) {
      return undefined;
    }
    if (
      input.step_code &&
      !this.database
        .prepare("SELECT 1 FROM hardware_test_steps WHERE run_id = ? AND step_code = ?")
        .get(runId, input.step_code)
    ) {
      throw new Error("UNKNOWN_STEP");
    }
    this.database
      .prepare(
        `INSERT INTO hardware_test_events (
          run_id, step_code, event_code, expected, observed, severity, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        runId,
        input.step_code ?? null,
        input.event_code,
        input.expected ?? null,
        input.observed ?? null,
        input.severity,
        this.now()
      );
    return this.getRun(runId);
  }

  finalizeRun(runId: string) {
    const run = this.getRun(runId);
    if (!run) return undefined;

    const incomplete = (run.steps as Array<{ status: string }>).some((step) => step.status !== "PASS");
    const firmware = run.firmware as Array<{ target: string; flash_status: string }>;
    const hasMainFirmware = firmware.some(
      (item) => item.target === "MAIN16" && item.flash_status === "PASS"
    );
    const hasSimFirmware = firmware.some(
      (item) => item.target === "SIMD4" && item.flash_status === "PASS"
    );
    const status = !incomplete && hasMainFirmware && hasSimFirmware ? "PASS" : "FAIL";
    const timestamp = this.now();

    this.database
      .prepare(
        "UPDATE hardware_test_runs SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?"
      )
      .run(status, timestamp, timestamp, runId);
    return this.getRun(runId);
  }
}
