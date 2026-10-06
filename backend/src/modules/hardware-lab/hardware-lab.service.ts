import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";
import {
  HARDWARE_FIRMWARE_CATALOG,
  HARDWARE_TEST_PROFILE_REVISION,
  HARDWARE_TEST_STEPS,
  evaluateHardwareStep,
  hardwareTestProfile,
} from "./hardware-lab.profile";
import type {
  CreateHardwareRunInput,
  HardwareEventInput,
  HardwareFirmwareEvidenceInput,
  HardwareMeasurementInput,
  HardwareStepEvidenceInput,
} from "./hardware-lab.schema";

export interface HardwareLabActor {
  principalId: string;
  username: string;
}

type RunRow = {
  id: string;
  run_number: string;
  profile_revision: string;
  prototype_type: string;
  status: "NOT_STARTED" | "TESTING" | "QUALIFIED" | "FAILED";
  main_hardware_uid: string | null;
  sim_d4_serial: string | null;
  operator_principal_id: string;
  operator_username: string;
  main_firmware_version: string | null;
  sim_firmware_version: string | null;
  main_firmware_sha256: string | null;
  sim_firmware_sha256: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type StepRow = {
  run_id: string;
  step_key: string;
  step_order: number;
  status: "PENDING" | "PASS" | "FAIL";
  evidence_json: string;
  evaluation_json: string;
  recorded_by: string | null;
  recorded_at: string | null;
};

function notFound(): AppError {
  return new AppError("Hardware qualification run not found", 404, "HARDWARE_RUN_NOT_FOUND");
}

function displayNumber(now: Date, id: string): string {
  return `HQT-${now.getUTCFullYear()}-${id.slice(0, 8).toUpperCase()}`;
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

export class HardwareLabService {
  constructor(
    private readonly database: Database.Database = sqlite,
    private readonly now: () => Date = () => new Date()
  ) {}

  profile() {
    return hardwareTestProfile();
  }

  create(input: CreateHardwareRunInput, actor: HardwareLabActor) {
    const id = randomUUID();
    const now = this.now();
    const timestamp = now.toISOString();
    const runNumber = displayNumber(now, id);

    this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO hardware_test_runs(
             id,run_number,profile_revision,prototype_type,status,
             main_hardware_uid,sim_d4_serial,operator_principal_id,operator_username,
             notes,created_at,updated_at
           ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .run(
          id,
          runNumber,
          HARDWARE_TEST_PROFILE_REVISION,
          input.prototypeType,
          "NOT_STARTED",
          input.mainHardwareUid ?? null,
          input.simD4Serial ?? null,
          actor.principalId,
          actor.username,
          input.notes ?? null,
          timestamp,
          timestamp
        );

      const insert = this.database.prepare(
        `INSERT INTO hardware_test_steps(run_id,step_key,step_order)
         VALUES(?,?,?)`
      );
      for (const step of HARDWARE_TEST_STEPS) {
        insert.run(id, step.key, step.order);
      }
    })();

    return this.get(id);
  }

  list() {
    return (this.database
      .prepare(
        `SELECT id,run_number AS runNumber,profile_revision AS profileRevision,
                prototype_type AS prototypeType,status,main_hardware_uid AS mainHardwareUid,
                sim_d4_serial AS simD4Serial,operator_username AS operatorUsername,
                created_at AS createdAt,updated_at AS updatedAt,completed_at AS completedAt,
                (SELECT COUNT(*) FROM hardware_test_steps s
                  WHERE s.run_id=r.id AND s.status='PASS') AS passedSteps,
                (SELECT COUNT(*) FROM hardware_test_steps s
                  WHERE s.run_id=r.id AND s.status='FAIL') AS failedSteps
         FROM hardware_test_runs r
         ORDER BY created_at DESC`
      )
      .all() as Array<Record<string, unknown>>).map((row) => ({
      ...row,
      totalSteps: HARDWARE_TEST_STEPS.length,
    }));
  }

  get(runId: string) {
    const run = this.database
      .prepare("SELECT * FROM hardware_test_runs WHERE id=?")
      .get(runId) as RunRow | undefined;
    if (!run) throw notFound();

    const steps = (this.database
      .prepare(
        `SELECT * FROM hardware_test_steps
         WHERE run_id=? ORDER BY step_order ASC`
      )
      .all(runId) as StepRow[]).map((step) => ({
      key: step.step_key,
      order: step.step_order,
      status: step.status,
      evidence: parseJson(step.evidence_json),
      evaluation: parseJson(step.evaluation_json),
      recordedBy: step.recorded_by,
      recordedAt: step.recorded_at,
    }));

    const firmware = this.database
      .prepare(
        `SELECT target,firmware_name AS firmwareName,firmware_version AS firmwareVersion,
                sha256,source_commit AS sourceCommit,port,flash_result AS flashResult,
                evidence_json AS evidenceJson,flashed_at AS flashedAt
         FROM hardware_test_firmware WHERE run_id=? ORDER BY target`
      )
      .all(runId) as Array<Record<string, unknown> & { evidenceJson: string }>;

    const counts = this.database
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM hardware_test_measurements WHERE run_id=?) AS measurements,
          (SELECT COUNT(*) FROM hardware_test_events WHERE run_id=?) AS events`
      )
      .get(runId, runId) as { measurements: number; events: number };

    return {
      id: run.id,
      runNumber: run.run_number,
      profileRevision: run.profile_revision,
      prototypeType: run.prototype_type,
      status: run.status,
      mainHardwareUid: run.main_hardware_uid,
      simD4Serial: run.sim_d4_serial,
      operatorPrincipalId: run.operator_principal_id,
      operatorUsername: run.operator_username,
      mainFirmwareVersion: run.main_firmware_version,
      simFirmwareVersion: run.sim_firmware_version,
      mainFirmwareSha256: run.main_firmware_sha256,
      simFirmwareSha256: run.sim_firmware_sha256,
      notes: run.notes,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      completedAt: run.completed_at,
      steps,
      firmware: firmware.map((item) => ({
        ...item,
        evidence: parseJson(item.evidenceJson),
        evidenceJson: undefined,
      })),
      counts,
    };
  }

  recordStep(
    runId: string,
    stepKey: string,
    input: HardwareStepEvidenceInput,
    actor: HardwareLabActor
  ) {
    const existing = this.database
      .prepare("SELECT id,status FROM hardware_test_runs WHERE id=?")
      .get(runId) as { id: string; status: string } | undefined;
    if (!existing) throw notFound();

    const definition = HARDWARE_TEST_STEPS.find((step) => step.key === stepKey);
    if (!definition) {
      throw new AppError("Hardware test step not found", 404, "HARDWARE_STEP_NOT_FOUND");
    }

    const evaluation = evaluateHardwareStep(stepKey, input.values);
    if (stepKey === "ACCURACY_FINAL") {
      const priorFailures = this.database
        .prepare(
          `SELECT step_key FROM hardware_test_steps
           WHERE run_id=? AND step_order < 14 AND status <> 'PASS'
           ORDER BY step_order`
        )
        .all(runId) as Array<{ step_key: string }>;
      if (priorFailures.length > 0) {
        evaluation.passed = false;
        evaluation.reasons.push(
          `Prior qualification stages are not PASS: ${priorFailures
            .map((item) => item.step_key)
            .join(", ")}`
        );
      }
    }

    const timestamp = this.now().toISOString();
    const stepStatus = evaluation.passed ? "PASS" : "FAIL";
    const nextRunStatus =
      stepKey === "ACCURACY_FINAL"
        ? evaluation.passed
          ? "QUALIFIED"
          : "FAILED"
        : "TESTING";

    this.database.transaction(() => {
      this.database
        .prepare(
          `UPDATE hardware_test_steps
           SET status=?,evidence_json=?,evaluation_json=?,recorded_by=?,recorded_at=?
           WHERE run_id=? AND step_key=?`
        )
        .run(
          stepStatus,
          JSON.stringify(input.values),
          JSON.stringify(evaluation),
          actor.username,
          timestamp,
          runId,
          stepKey
        );
      this.database
        .prepare(
          `UPDATE hardware_test_runs
           SET status=?,updated_at=?,completed_at=?
           WHERE id=?`
        )
        .run(
          nextRunStatus,
          timestamp,
          nextRunStatus === "QUALIFIED" || nextRunStatus === "FAILED"
            ? timestamp
            : null,
          runId
        );
    })();

    return this.get(runId);
  }

  addMeasurement(runId: string, input: HardwareMeasurementInput) {
    this.requireStep(runId, input.stepKey);
    const observedAt = input.observedAt ?? this.now().toISOString();
    const result = this.database
      .prepare(
        `INSERT INTO hardware_test_measurements(
           run_id,step_key,channel,metric_key,numeric_value,text_value,unit,observed_at
         ) VALUES(?,?,?,?,?,?,?,?)`
      )
      .run(
        runId,
        input.stepKey,
        input.channel ?? null,
        input.metricKey,
        input.numericValue ?? null,
        input.textValue ?? null,
        input.unit ?? null,
        observedAt
      );
    return { id: Number(result.lastInsertRowid), observedAt };
  }

  addEvent(runId: string, input: HardwareEventInput) {
    this.requireStep(runId, input.stepKey);
    const observedAt = input.observedAt ?? this.now().toISOString();
    const result = this.database
      .prepare(
        `INSERT INTO hardware_test_events(
           run_id,step_key,code,severity,payload_json,observed_at
         ) VALUES(?,?,?,?,?,?)`
      )
      .run(
        runId,
        input.stepKey,
        input.code,
        input.severity,
        JSON.stringify(input.payload),
        observedAt
      );
    return { id: Number(result.lastInsertRowid), observedAt };
  }

  listMeasurements(runId: string) {
    if (!this.database.prepare("SELECT 1 FROM hardware_test_runs WHERE id=?").get(runId)) {
      throw notFound();
    }
    return this.database
      .prepare(
        `SELECT id,step_key AS stepKey,channel,metric_key AS metricKey,
                numeric_value AS numericValue,text_value AS textValue,unit,
                observed_at AS observedAt
         FROM hardware_test_measurements
         WHERE run_id=?
         ORDER BY observed_at DESC,id DESC
         LIMIT 100`
      )
      .all(runId);
  }

  listEvents(runId: string) {
    if (!this.database.prepare("SELECT 1 FROM hardware_test_runs WHERE id=?").get(runId)) {
      throw notFound();
    }
    return (
      this.database
        .prepare(
          `SELECT id,step_key AS stepKey,code,severity,payload_json AS payloadJson,
                  observed_at AS observedAt
           FROM hardware_test_events
           WHERE run_id=?
           ORDER BY observed_at DESC,id DESC
           LIMIT 100`
        )
        .all(runId) as Array<Record<string, unknown> & { payloadJson: string }>
    ).map((item) => ({
      id: item.id,
      stepKey: item.stepKey,
      code: item.code,
      severity: item.severity,
      payload: parseJson(item.payloadJson),
      observedAt: item.observedAt,
    }));
  }

  recordFirmware(
    runId: string,
    target: "MAIN16_BENCH" | "SIMD4_BENCH" | "SITE_CONTROLLER_PILOT",
    input: HardwareFirmwareEvidenceInput
  ) {
    if (
      !this.database.prepare("SELECT 1 FROM hardware_test_runs WHERE id=?").get(runId)
    ) {
      throw notFound();
    }
    const catalog = HARDWARE_FIRMWARE_CATALOG.find((item) => item.target === target);
    if (catalog?.availability === "SOURCE_REQUIRED" && input.flashResult === "PASS") {
      throw new AppError(
        "Bench firmware cannot be marked PASS until a controlled source/package exists",
        409,
        "HARDWARE_FIRMWARE_PACKAGE_REQUIRED"
      );
    }
    const flashedAt = input.flashedAt ?? this.now().toISOString();
    this.database
      .prepare(
        `INSERT INTO hardware_test_firmware(
           run_id,target,firmware_name,firmware_version,sha256,source_commit,
           port,flash_result,evidence_json,flashed_at
         ) VALUES(?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(run_id,target) DO UPDATE SET
           firmware_name=excluded.firmware_name,
           firmware_version=excluded.firmware_version,
           sha256=excluded.sha256,
           source_commit=excluded.source_commit,
           port=excluded.port,
           flash_result=excluded.flash_result,
           evidence_json=excluded.evidence_json,
           flashed_at=excluded.flashed_at`
      )
      .run(
        runId,
        target,
        input.firmwareName,
        input.firmwareVersion,
        input.sha256?.toLowerCase() ?? null,
        input.sourceCommit?.toLowerCase() ?? null,
        input.port ?? null,
        input.flashResult,
        JSON.stringify(input.evidence),
        flashedAt
      );

    if (target === "MAIN16_BENCH") {
      this.database
        .prepare(
          `UPDATE hardware_test_runs
           SET main_firmware_version=?,main_firmware_sha256=?,updated_at=? WHERE id=?`
        )
        .run(
          input.firmwareVersion,
          input.sha256?.toLowerCase() ?? null,
          this.now().toISOString(),
          runId
        );
    }
    if (target === "SIMD4_BENCH") {
      this.database
        .prepare(
          `UPDATE hardware_test_runs
           SET sim_firmware_version=?,sim_firmware_sha256=?,updated_at=? WHERE id=?`
        )
        .run(
          input.firmwareVersion,
          input.sha256?.toLowerCase() ?? null,
          this.now().toISOString(),
          runId
        );
    }

    return this.get(runId);
  }

  report(runId: string) {
    const run = this.get(runId);
    return {
      generatedAt: this.now().toISOString(),
      decision: run.status,
      run,
      acceptance: {
        requiredSteps: HARDWARE_TEST_STEPS.length,
        passedSteps: run.steps.filter((step) => step.status === "PASS").length,
        failedSteps: run.steps.filter((step) => step.status === "FAIL").length,
        pendingSteps: run.steps.filter((step) => step.status === "PENDING").length,
        qualified:
          run.status === "QUALIFIED" &&
          run.steps.every((step) => step.status === "PASS"),
      },
    };
  }

  private requireStep(runId: string, stepKey: string): void {
    const exists = this.database
      .prepare(
        "SELECT 1 FROM hardware_test_steps WHERE run_id=? AND step_key=?"
      )
      .get(runId, stepKey);
    if (!exists) {
      throw new AppError("Hardware test step not found", 404, "HARDWARE_STEP_NOT_FOUND");
    }
  }
}

export const hardwareLabService = new HardwareLabService();
