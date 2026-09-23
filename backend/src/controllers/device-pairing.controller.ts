import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { devicePairingService } from "../modules/device-pairing/device-pairing.service";

const platformActor = (req: Request) =>
  `${req.platformPrincipal!.username}#${req.platformPrincipal!.id}`;

export const issueDevicePairingCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(201).json(
      devicePairingService.issuePairingCode(
        String(req.params.installationId),
        String(req.params.deviceId),
        platformActor(req)
      )
    );
  }
);

export const listDevicePlatformBindingsController = asyncHandler(
  async (req: Request, res: Response) => {
    res.json({
      bindings: devicePairingService.listBindings(String(req.params.installationId)),
    });
  }
);

export const claimDevicePairingController = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(201).json(devicePairingService.claim(req.body));
  }
);
