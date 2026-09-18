import { Request } from "express";
import { AuditActorSnapshot, AuditRequestContext } from "../../entities/AuditEvent";

export function platformAuditActor(req: Request): AuditActorSnapshot {
  const actor = req.platformPrincipal!;
  return {
    kind: "PLATFORM",
    id: actor.id,
    username: actor.username,
    role: actor.type,
  };
}

export function platformRequestContext(req: Request, source: string): AuditRequestContext {
  return {
    source,
    sessionId: req.platformSessionId,
  };
}
