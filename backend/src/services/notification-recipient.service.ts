import Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import { AuditActorSnapshot, AuditRequestContext } from "../entities/AuditEvent";
import {
  CreateNotificationRecipientInput,
  UpdateNotificationRecipientInput,
  UpdateNotificationRecipientStatusInput,
} from "../modules/notification/dto/notification-recipient.schema";
import { NOTIFICATION_RECIPIENT_AUDIT_ACTION } from "../modules/notification/notification-recipient-audit";
import {
  NotificationRecipient,
  NotificationRecipientRepository,
} from "../repositories/notification-recipient.repository";
import { SiteRepository } from "../repositories/site.repository";
import { auditEventService, AuditEventService } from "./audit-event.service";

const notFound = () => new AppError("Notification recipient not found", 404, "RECIPIENT_NOT_FOUND");
const siteNotFound = () => new AppError("Site not found", 404, "SITE_NOT_FOUND");

interface Dependencies {
  repository: NotificationRecipientRepository;
  sites: Pick<SiteRepository, "findById">;
  auditService: Pick<AuditEventService, "record">;
  runInTransaction: <T>(operation: () => T) => T;
}

export class NotificationRecipientService {
  private readonly dependencies: Dependencies;

  constructor(dependencies: Partial<Dependencies> = {}) {
    this.dependencies = {
      repository: dependencies.repository ?? new NotificationRecipientRepository(),
      sites: dependencies.sites ?? new SiteRepository(),
      auditService: dependencies.auditService ?? auditEventService,
      runInTransaction:
        dependencies.runInTransaction ?? ((operation) => sqlite.transaction(operation)()),
    };
  }

  list(siteId: number): NotificationRecipient[] {
    return this.dependencies.repository.listBySite(siteId);
  }

  resolveEligible(
    siteId: number,
    channel: string,
    severity: "WARNING" | "CRITICAL"
  ): NotificationRecipient[] {
    return this.dependencies.repository.resolveEligible(siteId, channel, severity);
  }

  create(
    actor: AuditActorSnapshot,
    input: CreateNotificationRecipientInput,
    requestContext: AuditRequestContext
  ): NotificationRecipient {
    return this.execute(
      actor,
      NOTIFICATION_RECIPIENT_AUDIT_ACTION.CREATED,
      input.uuid,
      input.site_id,
      requestContext,
      () => {
        if (!this.dependencies.sites.findById(input.site_id)) throw siteNotFound();
        const created = this.dependencies.repository.create(input);
        this.recordSuccess(
          actor,
          NOTIFICATION_RECIPIENT_AUDIT_ACTION.CREATED,
          created,
          undefined,
          requestContext
        );
        return created;
      }
    );
  }

  update(
    actor: AuditActorSnapshot,
    uuid: string,
    input: UpdateNotificationRecipientInput,
    requestContext: AuditRequestContext
  ): NotificationRecipient {
    const current = this.dependencies.repository.findByUuid(uuid);
    if (!current)
      return this.failNotFound(
        actor,
        NOTIFICATION_RECIPIENT_AUDIT_ACTION.UPDATED,
        uuid,
        requestContext
      );
    return this.execute(
      actor,
      NOTIFICATION_RECIPIENT_AUDIT_ACTION.UPDATED,
      uuid,
      current.site_id,
      requestContext,
      () => {
        const updated = this.dependencies.repository.update(uuid, input);
        if (!updated) throw notFound();
        this.recordSuccess(
          actor,
          NOTIFICATION_RECIPIENT_AUDIT_ACTION.UPDATED,
          updated,
          current,
          requestContext
        );
        return updated;
      }
    );
  }

  updateStatus(
    actor: AuditActorSnapshot,
    uuid: string,
    input: UpdateNotificationRecipientStatusInput,
    requestContext: AuditRequestContext
  ): NotificationRecipient {
    const current = this.dependencies.repository.findByUuid(uuid);
    if (!current)
      return this.failNotFound(
        actor,
        NOTIFICATION_RECIPIENT_AUDIT_ACTION.STATUS_UPDATED,
        uuid,
        requestContext
      );
    return this.execute(
      actor,
      NOTIFICATION_RECIPIENT_AUDIT_ACTION.STATUS_UPDATED,
      uuid,
      current.site_id,
      requestContext,
      () => {
        const updated = this.dependencies.repository.updateStatus(uuid, input.status);
        if (!updated) throw notFound();
        this.recordSuccess(
          actor,
          NOTIFICATION_RECIPIENT_AUDIT_ACTION.STATUS_UPDATED,
          updated,
          current,
          requestContext
        );
        return updated;
      }
    );
  }

  private execute<T>(
    actor: AuditActorSnapshot,
    action: string,
    uuid: string,
    siteId: number,
    requestContext: AuditRequestContext,
    operation: () => T
  ): T {
    try {
      return this.dependencies.runInTransaction(operation);
    } catch (error) {
      const mapped = mapError(error);
      this.recordFailure(actor, action, uuid, siteId, requestContext, mapped);
      throw mapped;
    }
  }

  private failNotFound(
    actor: AuditActorSnapshot,
    action: string,
    uuid: string,
    requestContext: AuditRequestContext
  ): never {
    const error = notFound();
    this.recordFailure(actor, action, uuid, undefined, requestContext, error);
    throw error;
  }

  private recordSuccess(
    actor: AuditActorSnapshot,
    action: string,
    current: NotificationRecipient,
    previous: NotificationRecipient | undefined,
    requestContext: AuditRequestContext
  ): void {
    this.dependencies.auditService.record({
      actor,
      action,
      target: { type: "NOTIFICATION_RECIPIENT", id: current.uuid },
      siteId: current.site_id,
      result: "SUCCESS",
      previousValues: previous ? safeValues(previous) : undefined,
      newValues: safeValues(current),
      requestContext,
    });
  }

  private recordFailure(
    actor: AuditActorSnapshot,
    action: string,
    uuid: string,
    siteId: number | undefined,
    requestContext: AuditRequestContext,
    error: unknown
  ): void {
    try {
      this.dependencies.auditService.record({
        actor,
        action,
        target: { type: "NOTIFICATION_RECIPIENT", id: uuid },
        siteId,
        result: "FAILED",
        requestContext,
        reason: error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR",
      });
    } catch {
      // Preserve the original failure and never copy contact input into failure evidence.
    }
  }
}

function safeValues(recipient: NotificationRecipient): Record<string, unknown> {
  return {
    display_name: recipient.display_name,
    role: recipient.role,
    status: recipient.status,
    endpoints: recipient.endpoints.map(({ channel, eligible_severities }) => ({
      channel,
      eligible_severities,
    })),
  };
}

function mapError(error: unknown): unknown {
  if (error instanceof Database.SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return new AppError("Notification recipient already exists", 409, "RECIPIENT_ALREADY_EXISTS");
  }
  return error;
}

export const notificationRecipientService = new NotificationRecipientService();
