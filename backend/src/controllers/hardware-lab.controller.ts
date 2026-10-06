import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { hardwareLabService } from "../modules/hardware-lab/hardware-lab.service";

const actor = (request: Request) => ({
  principalId: request.platformPrincipal!.id,
  username: request.platformPrincipal!.username,
});

export const getHardwareLabProfile = (_request: Request, response: Response): void => {
  response.json(hardwareLabService.profile());
};

export const listHardwareRuns = (_request: Request, response: Response): void => {
  response.json({ runs: hardwareLabService.list() });
};

export const createHardwareRun = (request: Request, response: Response): void => {
  response.status(201).json(hardwareLabService.create(request.body, actor(request)));
};

export const getHardwareRun = (request: Request, response: Response): void => {
  response.json(hardwareLabService.get(String(request.params.runId)));
};

export const recordHardwareStep = (request: Request, response: Response): void => {
  response.json(
    hardwareLabService.recordStep(
      String(request.params.runId),
      String(request.params.stepKey),
      request.body,
      actor(request)
    )
  );
};

export const addHardwareMeasurement = (request: Request, response: Response): void => {
  response
    .status(201)
    .json(hardwareLabService.addMeasurement(String(request.params.runId), request.body));
};

export const addHardwareEvent = (request: Request, response: Response): void => {
  response.status(201).json(hardwareLabService.addEvent(String(request.params.runId), request.body));
};

export const recordHardwareFirmware = (request: Request, response: Response): void => {
  response.json(
    hardwareLabService.recordFirmware(
      String(request.params.runId),
      request.params.target as "MAIN16_BENCH" | "SIMD4_BENCH" | "SITE_CONTROLLER_PILOT",
      request.body
    )
  );
};

export const getHardwareQualificationReport = asyncHandler(
  async (request: Request, response: Response) => {
    response.json(hardwareLabService.report(String(request.params.runId)));
  }
);
