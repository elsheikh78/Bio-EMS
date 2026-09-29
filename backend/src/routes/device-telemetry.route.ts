import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { deviceTelemetryService } from "../modules/device-telemetry/device-telemetry.service";

const router = Router();
router.post(
  "/:bindingId",
  asyncHandler(async (request, response) => {
    const authorized = await deviceTelemetryService.accept(
      String(request.params.bindingId),
      request.header("x-bioems-device-token") ?? "",
      request.body
    );
    if (!authorized) return response.status(401).json({ code: "DEVICE_TELEMETRY_UNAUTHORIZED" });
    return response.status(202).json({ accepted: true });
  })
);
export default router;
