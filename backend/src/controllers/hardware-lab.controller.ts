import { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { HardwareLabRepository } from "../modules/hardware-lab/hardware-lab.repository";
import {
  HARDWARE_PROFILE_REV,
  TEST_PROFILE_REV,
  hardwareLabFaultCodes,
  hardwareLabFirmwareProfiles,
  hardwareLabSteps,
} from "../modules/hardware-lab/hardware-lab.profile";

const repository = new HardwareLabRepository();
const actor = (req: Request) => `${req.platformPrincipal!.username}#${req.platformPrincipal!.id}`;

const notFound = () => new AppError("Hardware test run not found", 404, "HARDWARE_TEST_NOT_FOUND");
const conflict = (message: string, code: string) => new AppError(message, 409, code);

export const getHardwareLabProfile = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    hardware_profile_rev: HARDWARE_PROFILE_REV,
    test_profile_rev: TEST_PROFILE_REV,
    sensor_success_rate_percent: 99.99,
    firmware: hardwareLabFirmwareProfiles,
    fault_codes: hardwareLabFaultCodes,
    steps: hardwareLabSteps,
  });
});

export const listHardwareTestRuns = asyncHandler(async (req: Request, res: Response) => {
  const requested = Number(req.query.limit ?? 50);
  res.json({ runs: repository.listRuns(Number.isFinite(requested) ? requested : 50) });
});

export const createHardwareTestRun = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(repository.createRun(req.body, actor(req)));
});

export const getHardwareTestRun = asyncHandler(async (req: Request, res: Response) => {
  const run = repository.getRun(String(req.params.runId));
  if (!run) throw notFound();
  res.json(run);
});

export const startHardwareTestStep = asyncHandler(async (req: Request, res: Response) => {
  try {
    const run = repository.startStep(String(req.params.runId), String(req.params.stepCode));
    if (!run) throw notFound();
    res.json(run);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.message === "PREVIOUS_STEP_NOT_PASSED") {
      throw conflict(
        "Previous hardware qualification step must pass first",
        "HARDWARE_TEST_SEQUENCE_BLOCKED"
      );
    }
    throw error;
  }
});

export const recordHardwareTestStepResult = asyncHandler(async (req: Request, res: Response) => {
  const result = repository.recordStepResult(
    String(req.params.runId),
    String(req.params.stepCode),
    req.body
  );
  if (!result) throw notFound();
  res.json(result);
});

export const recordHardwareFirmwareEvidence = asyncHandler(async (req: Request, res: Response) => {
  const run = repository.recordFirmware(String(req.params.runId), req.body);
  if (!run) throw notFound();
  res.status(201).json(run);
});

export const recordHardwareTestEvent = asyncHandler(async (req: Request, res: Response) => {
  try {
    const run = repository.recordEvent(String(req.params.runId), req.body);
    if (!run) throw notFound();
    res.status(201).json(run);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.message === "UNKNOWN_STEP") {
      throw conflict("Unknown hardware qualification step", "HARDWARE_TEST_UNKNOWN_STEP");
    }
    throw error;
  }
});

export const finalizeHardwareTestRun = asyncHandler(async (req: Request, res: Response) => {
  const run = repository.finalizeRun(String(req.params.runId));
  if (!run) throw notFound();
  res.json(run);
});
