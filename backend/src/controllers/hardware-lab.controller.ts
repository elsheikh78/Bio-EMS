import { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { HardwareLabRepository } from "../modules/hardware-lab/hardware-lab.repository";

// Archive access only. Existing tables and historical rows are preserved.
const repository = new HardwareLabRepository();

export const listHardwareTestRuns = asyncHandler(async (req: Request, res: Response) => {
  const requested = Number(req.query.limit ?? 50);
  res.json({ runs: repository.listRuns(Number.isFinite(requested) ? requested : 50) });
});

export const getHardwareTestRun = asyncHandler(async (req: Request, res: Response) => {
  const run = repository.getRun(String(req.params.runId));
  if (!run) throw new AppError("Hardware test run not found", 404, "HARDWARE_TEST_NOT_FOUND");
  res.json(run);
});
