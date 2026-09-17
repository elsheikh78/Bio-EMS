import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  listAdminCommunicationChannels,
  saveAdminCommunicationChannel,
  testAdminCommunicationChannel,
} from "../controllers/communication-channel.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  communicationChannelListQuerySchema,
  communicationChannelParamsSchema,
  saveCommunicationChannelSchema,
  testCommunicationChannelSchema,
} from "../modules/communication-channels/communication-channel.schema";

const router = Router();
router.get(
  "/",
  requirePermission(PERMISSION.COMMUNICATION_CHANNEL_READ),
  validateQuery(communicationChannelListQuerySchema),
  listAdminCommunicationChannels
);
router.put(
  "/:channel",
  requirePermission(PERMISSION.COMMUNICATION_CHANNEL_MANAGE),
  validateParams(communicationChannelParamsSchema),
  validateBody(saveCommunicationChannelSchema),
  saveAdminCommunicationChannel
);
router.post(
  "/:channel/test",
  requirePermission(PERMISSION.COMMUNICATION_CHANNEL_MANAGE),
  validateParams(communicationChannelParamsSchema),
  validateBody(testCommunicationChannelSchema),
  testAdminCommunicationChannel
);
export default router;
