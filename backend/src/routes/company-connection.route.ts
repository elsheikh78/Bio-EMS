import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate-request";
import {
  configureConnection,
  connectionStatus,
  disableConnection,
} from "../modules/company-cloud/runtime";

const router = Router();
router.get("/", (_req, res) => res.json(connectionStatus()));
router.put(
  "/",
  validateBody(
    z
      .object({
        url: z.string().max(250),
        siteId: z.string().max(64),
        token: z.string().max(64),
        remoteControl: z.boolean(),
      })
      .strict()
  ),
  (req, res) => {
    try {
      res.json(configureConnection(req.body));
    } catch {
      res.status(400).json({
        error: {
          code: "CLOUD_CONFIGURATION_INVALID",
          message:
            "Verify the company address, site ID and connection token; owner encryption key is required.",
        },
      });
    }
  }
);
router.delete("/", (_req, res) => res.json(disableConnection()));
export default router;
