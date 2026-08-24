export const AUDIT_ACTOR_KINDS = ["CUSTOMER_USER", "PLATFORM"] as const;
export type AuditActorKind = (typeof AUDIT_ACTOR_KINDS)[number];

export const AUDIT_RESULTS = ["SUCCESS", "DENIED", "FAILED"] as const;
export type AuditResult = (typeof AUDIT_RESULTS)[number];

export type AuditStructuredValues = Record<string, unknown>;

export interface AuditActorSnapshot {
  kind: AuditActorKind;
  id: string;
  username: string;
  role: string;
}

export interface AuditTarget {
  type: string;
  id: string;
}

export interface AuditRequestContext {
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  source: string;
}

export interface AuditEventInput {
  actor: AuditActorSnapshot;
  action: string;
  target?: AuditTarget;
  siteId?: number;
  result: AuditResult;
  previousValues?: AuditStructuredValues;
  newValues?: AuditStructuredValues;
  requestContext: AuditRequestContext;
  reason?: string;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  occurredAt: string;
  createdAt: string;
}
