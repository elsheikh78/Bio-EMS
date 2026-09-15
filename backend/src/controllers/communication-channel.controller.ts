import type { Request, Response } from "express";
import { config } from "../config/config";
import { AppError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { CommunicationChannelService } from "../modules/communication-channels/communication-channel.service";
import { auditEventService } from "../services/audit-event.service";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";

function service(): CommunicationChannelService {
  if (!config.communicationConfigEncryptionKey) {
    throw new AppError(
      "Communication configuration encryption is unavailable",
      503,
      "COMMUNICATION_CONFIG_UNAVAILABLE"
    );
  }
  return new CommunicationChannelService(config.communicationConfigEncryptionKey);
}

const siteId = (req: Request): number | null => {
  const raw = req.method === "GET" ? req.query.siteId : req.body.siteId;
  return raw === undefined || raw === null ? null : Number(raw);
};

export const listAdminCommunicationChannels = asyncHandler(async (req: Request, res: Response) => {
  const channelService = service();
  const scope = channelService.scopeForAdmin(req.user!.id, siteId(req));
  res.json({ channels: channelService.list(scope) });
});

export const saveAdminCommunicationChannel = asyncHandler(async (req: Request, res: Response) => {
  const channelService = service();
  const scope = channelService.scopeForAdmin(req.user!.id, siteId(req));
  const saved = channelService.save(
    scope,
    req.params.channel as never,
    req.body,
    `${req.user!.username}#${req.user!.id}`
  );
  auditEventService.record({
    actor: customerAuditActor(req),
    action: "COMMUNICATION_CHANNEL.CONFIGURED",
    target: { type: "COMMUNICATION_CHANNEL", id: String(req.params.channel) },
    ...(scope.siteId ? { siteId: scope.siteId } : {}),
    result: "SUCCESS",
    newValues: {
      customerId: scope.customerId,
      siteId: scope.siteId,
      config: saved.config,
      secretsConfigured: saved.secretsConfigured,
    },
    requestContext: customerRequestContext("COMMUNICATION_CHANNEL_API"),
  });
  res.json(saved);
});

export const listOwnerCommunicationChannels = asyncHandler(async (req: Request, res: Response) => {
  const channelService = service();
  const scope = channelService.scopeForOwner(Number(req.params.customerId), siteId(req));
  res.json({ channels: channelService.list(scope) });
});

export const saveOwnerCommunicationChannel = asyncHandler(async (req: Request, res: Response) => {
  const channelService = service();
  const scope = channelService.scopeForOwner(Number(req.params.customerId), siteId(req));
  const saved = channelService.save(
    scope,
    req.params.channel as never,
    req.body,
    `${req.platformPrincipal!.username}#${req.platformPrincipal!.id}`
  );
  auditEventService.record({
    actor: {
      kind: "PLATFORM",
      id: req.platformPrincipal!.id,
      username: req.platformPrincipal!.username,
      role: "SYSTEM_OWNER",
    },
    action: "COMMUNICATION_CHANNEL.CONFIGURED",
    target: { type: "COMMUNICATION_CHANNEL", id: String(req.params.channel) },
    ...(scope.siteId ? { siteId: scope.siteId } : {}),
    result: "SUCCESS",
    newValues: {
      customerId: scope.customerId,
      siteId: scope.siteId,
      config: saved.config,
      secretsConfigured: saved.secretsConfigured,
    },
    requestContext: {
      source: "PLATFORM_COMMUNICATION_CHANNEL_API",
      sessionId: req.platformSessionId,
    },
  });
  res.json(saved);
});

export const testAdminCommunicationChannel = asyncHandler(async (req: Request, res: Response) => {
  const channelService = service();
  const scope = channelService.scopeForAdmin(req.user!.id, Number(req.body.siteId));
  const receipt = await channelService.test(
    scope,
    req.params.channel as never,
    req.body.destination
  );
  auditEventService.record({
    actor: customerAuditActor(req),
    action: "COMMUNICATION_CHANNEL.TEST_SENT",
    target: { type: "COMMUNICATION_CHANNEL", id: String(req.params.channel) },
    siteId: scope.siteId!,
    result: "SUCCESS",
    newValues: { customerId: scope.customerId, messageId: receipt.messageId },
    requestContext: customerRequestContext("COMMUNICATION_CHANNEL_API"),
  });
  res.json({ success: true, messageId: receipt.messageId });
});

export const testOwnerCommunicationChannel = asyncHandler(async (req: Request, res: Response) => {
  const channelService = service();
  const scope = channelService.scopeForOwner(
    Number(req.params.customerId),
    Number(req.body.siteId)
  );
  const receipt = await channelService.test(
    scope,
    req.params.channel as never,
    req.body.destination
  );
  auditEventService.record({
    actor: {
      kind: "PLATFORM",
      id: req.platformPrincipal!.id,
      username: req.platformPrincipal!.username,
      role: "SYSTEM_OWNER",
    },
    action: "COMMUNICATION_CHANNEL.TEST_SENT",
    target: { type: "COMMUNICATION_CHANNEL", id: String(req.params.channel) },
    siteId: scope.siteId!,
    result: "SUCCESS",
    newValues: { customerId: scope.customerId, messageId: receipt.messageId },
    requestContext: {
      source: "PLATFORM_COMMUNICATION_CHANNEL_API",
      sessionId: req.platformSessionId,
    },
  });
  res.json({ success: true, messageId: receipt.messageId });
});
