import { Request } from "express";
import { AuditActorSnapshot, AuditRequestContext } from "../../entities/AuditEvent";

export function customerAuditActor(req: Request): AuditActorSnapshot {
  const actor = req.user!;
  return {
    kind: "CUSTOMER_USER",
    id: String(actor.id),
    username: actor.username,
    role: actor.role,
  };
}

export function customerRequestContext(source: string): AuditRequestContext {
  return { source };
}
