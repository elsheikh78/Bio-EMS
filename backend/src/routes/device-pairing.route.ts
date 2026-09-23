import { Router } from "express";
import { claimDevicePairingController } from "../controllers/device-pairing.controller";
import { devicePairingRateLimitMiddleware } from "../middleware/device-pairing-rate-limit.middleware";
import { validateBody } from "../middleware/validate-request";
import { devicePairingClaimSchema } from "../modules/device-pairing/device-pairing.schema";

const router = Router();

router.post(
  "/claim",
  devicePairingRateLimitMiddleware,
  validateBody(devicePairingClaimSchema),
  claimDevicePairingController
);

export default router;
