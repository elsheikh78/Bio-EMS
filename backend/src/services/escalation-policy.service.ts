import Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import { AuditActorSnapshot, AuditRequestContext } from "../entities/AuditEvent";
import { AppError } from "../errors/app-error";
import {
  CreateEscalationPolicyInput,
  UpdateEscalationPolicyInput,
  UpdateEscalationPolicyStatusInput,
} from "../modules/notification/dto/escalation-policy.schema";
import { ESCALATION_POLICY_AUDIT_ACTION } from "../modules/notification/escalation-policy-audit";
import {
  EscalationPolicy,
  EscalationPolicyRepository,
} from "../repositories/escalation-policy.repository";
import { SiteRepository } from "../repositories/site.repository";
import { auditEventService, AuditEventService } from "./audit-event.service";

const missing = () =>
  new AppError("Escalation policy not found", 404, "ESCALATION_POLICY_NOT_FOUND");
interface Dependencies {
  repository: EscalationPolicyRepository;
  sites: Pick<SiteRepository, "findById">;
  auditService: Pick<AuditEventService, "record">;
  runInTransaction: <T>(operation: () => T) => T;
}
export class EscalationPolicyService {
  private readonly d: Dependencies;
  constructor(dependencies: Partial<Dependencies> = {}) {
    this.d = {
      repository: dependencies.repository ?? new EscalationPolicyRepository(),
      sites: dependencies.sites ?? new SiteRepository(),
      auditService: dependencies.auditService ?? auditEventService,
      runInTransaction:
        dependencies.runInTransaction ?? ((operation) => sqlite.transaction(operation)()),
    };
  }
  list(siteId: number) {
    return this.d.repository.listBySite(siteId);
  }
  resolveDue(siteId: number, severity: "WARNING" | "CRITICAL", elapsedSeconds: number) {
    return this.d.repository.resolveDue(siteId, severity, elapsedSeconds);
  }
  create(
    actor: AuditActorSnapshot,
    input: CreateEscalationPolicyInput,
    context: AuditRequestContext
  ) {
    return this.execute(
      actor,
      ESCALATION_POLICY_AUDIT_ACTION.CREATED,
      input.uuid,
      input.site_id,
      context,
      () => {
        if (!this.d.sites.findById(input.site_id))
          throw new AppError("Site not found", 404, "SITE_NOT_FOUND");
        const value = this.d.repository.create(input);
        this.audit(actor, ESCALATION_POLICY_AUDIT_ACTION.CREATED, value, undefined, context);
        return value;
      }
    );
  }
  update(
    actor: AuditActorSnapshot,
    uuid: string,
    input: UpdateEscalationPolicyInput,
    context: AuditRequestContext
  ) {
    const previous = this.d.repository.findByUuid(uuid);
    if (!previous) throw missing();
    return this.execute(
      actor,
      ESCALATION_POLICY_AUDIT_ACTION.UPDATED,
      uuid,
      previous.site_id,
      context,
      () => {
        const value = this.d.repository.update(uuid, input);
        if (!value) throw missing();
        this.audit(actor, ESCALATION_POLICY_AUDIT_ACTION.UPDATED, value, previous, context);
        return value;
      }
    );
  }
  updateStatus(
    actor: AuditActorSnapshot,
    uuid: string,
    input: UpdateEscalationPolicyStatusInput,
    context: AuditRequestContext
  ) {
    const previous = this.d.repository.findByUuid(uuid);
    if (!previous) throw missing();
    return this.execute(
      actor,
      ESCALATION_POLICY_AUDIT_ACTION.STATUS_UPDATED,
      uuid,
      previous.site_id,
      context,
      () => {
        const value = this.d.repository.updateStatus(uuid, input.status);
        if (!value) throw missing();
        this.audit(actor, ESCALATION_POLICY_AUDIT_ACTION.STATUS_UPDATED, value, previous, context);
        return value;
      }
    );
  }
  private execute<T>(
    actor: AuditActorSnapshot,
    action: string,
    uuid: string,
    siteId: number,
    context: AuditRequestContext,
    operation: () => T
  ): T {
    try {
      return this.d.runInTransaction(operation);
    } catch (error) {
      const mapped =
        error instanceof Database.SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE"
          ? new AppError(
              "Escalation policy already exists",
              409,
              "ESCALATION_POLICY_ALREADY_EXISTS"
            )
          : error;
      try {
        this.d.auditService.record({
          actor,
          action,
          target: { type: "ESCALATION_POLICY", id: uuid },
          siteId,
          result: "FAILED",
          requestContext: context,
          reason: mapped instanceof AppError ? mapped.code : "INTERNAL_SERVER_ERROR",
        });
      } catch {
        /* preserve original */
      }
      throw mapped;
    }
  }
  private audit(
    actor: AuditActorSnapshot,
    action: string,
    value: EscalationPolicy,
    previous: EscalationPolicy | undefined,
    context: AuditRequestContext
  ) {
    this.d.auditService.record({
      actor,
      action,
      target: { type: "ESCALATION_POLICY", id: value.uuid },
      siteId: value.site_id,
      result: "SUCCESS",
      previousValues: previous ? safe(previous) : undefined,
      newValues: safe(value),
      requestContext: context,
    });
  }
}
function safe(value: EscalationPolicy) {
  return {
    name: value.name,
    owner_role: value.owner_role,
    eligible_severities: value.eligible_severities,
    status: value.status,
    steps: value.steps.map(({ position, delay_seconds, recipient_role, channels }) => ({
      position,
      delay_seconds,
      recipient_role,
      channels,
    })),
  };
}
export const escalationPolicyService = new EscalationPolicyService();
