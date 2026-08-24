import { randomUUID } from "crypto";
import { AuditEvent, AuditEventInput } from "../entities/AuditEvent";
import { AuditEventRepository } from "../repositories/audit-event.repository";
import { redactAuditText, redactAuditValues } from "../modules/audit/audit-redaction";

export interface AuditEventServiceDependencies {
  repository: AuditEventRepository;
  generateId?: () => string;
  now?: () => Date;
}

export class AuditEventService {
  private readonly generateId: () => string;
  private readonly now: () => Date;

  constructor(private readonly dependencies: AuditEventServiceDependencies) {
    this.generateId = dependencies.generateId ?? randomUUID;
    this.now = dependencies.now ?? (() => new Date());
  }

  record(input: AuditEventInput): AuditEvent {
    return this.dependencies.repository.append({
      ...input,
      actor: {
        ...input.actor,
        id: redactAuditText(input.actor.id)!,
        username: redactAuditText(input.actor.username)!,
      },
      target: input.target ? { ...input.target, id: redactAuditText(input.target.id)! } : undefined,
      previousValues: redactAuditValues(input.previousValues),
      newValues: redactAuditValues(input.newValues),
      requestContext: {
        ...input.requestContext,
        requestId: redactAuditText(input.requestContext.requestId),
        sessionId: redactAuditText(input.requestContext.sessionId),
        correlationId: redactAuditText(input.requestContext.correlationId),
        source: redactAuditText(input.requestContext.source)!,
      },
      reason: redactAuditText(input.reason),
      id: this.generateId(),
      occurredAt: this.now().toISOString(),
    });
  }

  listForCustomerSite(siteId: number, limit: number): AuditEvent[] {
    return this.dependencies.repository.list({ siteId, limit });
  }

  listForPlatform(siteId: number | undefined, limit: number): AuditEvent[] {
    return this.dependencies.repository.list({ siteId, limit });
  }
}
