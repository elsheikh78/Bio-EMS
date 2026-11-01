import { Router } from "express";
import { z } from "zod";
import { sqlite } from "../../database/sqlite/client";
import { asyncHandler } from "../middleware/async-handler";
import { deviceTelemetryService } from "../modules/device-telemetry/device-telemetry.service";
import { ControllerHealthService } from "../modules/controller-runtime/controller-health";
import { FeaturePolicyStore } from "../modules/controller-runtime/feature-policy";
import {
  decryptRelay,
  encryptRelay,
  relayEnvelopeSchema,
} from "../modules/controller-runtime/relay-crypto";

import { NetworkSettingsStore } from "../modules/controller-runtime/network-settings";

const router = Router();
const pending = new Map<string, Promise<unknown>>();
const requestSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{32}$/),
    type: z.enum(["sample", "health", "status"]),
    payload: z.unknown(),
  })
  .strict();
// BLE bridge forwards opaque authenticated ciphertext. It holds no device key.
router.post(
  "/exchange",
  asyncHandler(async (req, res) => {
    const envelope = relayEnvelopeSchema.parse(req.body);
    const row = sqlite
      .prepare(
        `SELECT telemetry_token_hash AS key FROM device_platform_bindings
    WHERE platform_binding_id=? AND status='ACTIVE'`
      )
      .get(envelope.binding) as { key: string } | undefined;
    if (!row?.key) return res.status(401).json({ code: "CONTROLLER_UNAUTHORIZED" });
    const key = Buffer.from(row.key, "hex");
    let message: z.infer<typeof requestSchema>;
    try {
      message = requestSchema.parse(decryptRelay(envelope, key));
    } catch {
      return res.status(401).json({ code: "CONTROLLER_UNAUTHORIZED" });
    }
    // Serialize per binding: simultaneous HTTPS/BLE deliveries cannot double-process a sample.
    // Bound queue admission so unauthenticated floods cannot grow promise chains.
    if (pending.has(envelope.binding)) return res.status(429).json({ code: "CONTROLLER_BUSY" });
    const work = (async () => {
      let accepted = true;
      if (message.type === "sample")
        accepted = await deviceTelemetryService.acceptDigest(
          envelope.binding,
          row.key,
          message.payload
        );
      else if (message.type === "health")
        new ControllerHealthService().accept(envelope.binding, message.payload);
      return encryptRelay(
        envelope.binding,
        {
          id: message.id,
          accepted,
          ...new FeaturePolicyStore().get(envelope.binding),
          wifiConfig: new NetworkSettingsStore().credentials(envelope.binding),
          epoch: Math.floor(Date.now() / 1000),
        },
        key
      );
    })();
    pending.set(envelope.binding, work);
    try {
      return res.json(await work);
    } finally {
      pending.delete(envelope.binding);
    }
  })
);
export default router;
