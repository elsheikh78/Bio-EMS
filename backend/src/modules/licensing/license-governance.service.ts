import type Database from "better-sqlite3";
import { AppError } from "../../errors/app-error";
import { assertLicenseTransition, type LicenseStatus } from "./licensing.domain";

export class LicenseGovernanceService {
  constructor(private readonly database: Database.Database) {}

  bindDevice(
    licenseId: number,
    deviceId: number,
    actor: string,
    at = new Date().toISOString()
  ): void {
    const scope = this.database
      .prepare(
        `SELECT l.installation_id,i.site_id,d.site_id,d.device_id FROM site_bound_licenses l JOIN licensing_installations i ON i.id=l.installation_id JOIN devices d ON d.id=? WHERE l.id=?`
      )
      .get(deviceId, licenseId) as { site_id: number; device_id: string } | undefined;
    if (!scope) throw new AppError("License or device not found", 404, "LICENSE_DEVICE_NOT_FOUND");
    const installationSite = this.database
      .prepare(
        "SELECT i.site_id FROM site_bound_licenses l JOIN licensing_installations i ON i.id=l.installation_id WHERE l.id=?"
      )
      .pluck()
      .get(licenseId);
    if (scope.site_id !== installationSite)
      throw new AppError("Device belongs to another Site", 409, "LICENSE_DEVICE_SITE_MISMATCH");
    this.database.transaction(() => {
      this.database
        .prepare(
          "INSERT INTO licensed_device_bindings (license_id,device_id,device_identity,status,bound_at,bound_by) VALUES (?,?,?,'AUTHORIZED',?,?)"
        )
        .run(licenseId, deviceId, scope.device_id, at, actor);
      this.event(licenseId, "DEVICE_AUTHORIZED", actor, at, {
        deviceId,
        deviceIdentity: scope.device_id,
      });
    })();
  }

  recordValidation(
    licenseId: number,
    result: "VALID" | "OFFLINE_GRACE" | "RESTRICTED",
    actor: string,
    at: string,
    next: string | null
  ): void {
    this.database.transaction(() => {
      this.database
        .prepare(
          "INSERT INTO license_validation_events (license_id,result,validated_at,next_validation_at,evidence_json) VALUES (?,?,?,?,?)"
        )
        .run(licenseId, result, at, next, JSON.stringify({ actor }));
      const installationId = Number(
        this.database
          .prepare("SELECT installation_id FROM site_bound_licenses WHERE id=?")
          .pluck()
          .get(licenseId)
      );
      if (!installationId) throw new AppError("License not found", 404, "LICENSE_NOT_FOUND");
      this.event(licenseId, `VALIDATION_${result}`, actor, at, { nextValidationAt: next });
    })();
  }

  transition(
    licenseId: number,
    to: LicenseStatus,
    actor: string,
    at = new Date().toISOString()
  ): void {
    this.database.transaction(() => {
      const record = this.database
        .prepare("SELECT installation_id,status FROM site_bound_licenses WHERE id=?")
        .get(licenseId) as { installation_id: number; status: LicenseStatus } | undefined;
      if (!record) throw new AppError("License not found", 404, "LICENSE_NOT_FOUND");
      assertLicenseTransition(record.status, to);
      this.database
        .prepare("UPDATE site_bound_licenses SET status=? WHERE id=?")
        .run(to, licenseId);
      if (to === "REVOKED")
        this.database
          .prepare("UPDATE licensing_installations SET status='REVOKED',updated_at=? WHERE id=?")
          .run(at, record.installation_id);
      this.event(licenseId, `LICENSE_${to}`, actor, at, {});
    })();
  }

  transfer(
    licenseId: number,
    targetInstallationId: number,
    reason: string,
    actor: string,
    at = new Date().toISOString()
  ): void {
    this.database.transaction(() => {
      const license = this.database
        .prepare("SELECT installation_id,status FROM site_bound_licenses WHERE id=?")
        .get(licenseId) as { installation_id: number; status: LicenseStatus } | undefined;
      const target = this.database
        .prepare("SELECT id,customer_id,site_id FROM licensing_installations WHERE id=?")
        .get(targetInstallationId) as
        { id: number; customer_id: number; site_id: number } | undefined;
      const source =
        license &&
        (this.database
          .prepare("SELECT customer_id,site_id FROM licensing_installations WHERE id=?")
          .get(license.installation_id) as { customer_id: number; site_id: number } | undefined);
      if (!license || !target || !source)
        throw new AppError("Transfer scope not found", 404, "LICENSE_TRANSFER_SCOPE_NOT_FOUND");
      if (target.customer_id !== source.customer_id || target.site_id !== source.site_id)
        throw new AppError(
          "Transfer must remain within the licensed Customer and Site",
          409,
          "LICENSE_TRANSFER_SCOPE_MISMATCH"
        );
      if (!reason.trim())
        throw new AppError("Transfer reason is required", 400, "LICENSE_TRANSFER_REASON_REQUIRED");
      this.database
        .prepare(
          "INSERT INTO license_transfers (license_id,from_installation_id,to_installation_id,reason,transferred_at,transferred_by) VALUES (?,?,?,?,?,?)"
        )
        .run(licenseId, license.installation_id, target.id, reason.trim(), at, actor);
      this.database
        .prepare("UPDATE site_bound_licenses SET status='SUPERSEDED' WHERE id=?")
        .run(licenseId);
      this.database
        .prepare("UPDATE licensing_installations SET status='RETIRED',updated_at=? WHERE id=?")
        .run(at, license.installation_id);
      this.event(licenseId, "LICENSE_TRANSFERRED", actor, at, {
        fromInstallationId: license.installation_id,
        toInstallationId: target.id,
        reason: reason.trim(),
      });
    })();
  }

  overview() {
    return {
      installations: this.database
        .prepare(
          "SELECT id,installation_uuid AS installationId,customer_id AS customerId,site_id AS siteId,status,updated_at AS updatedAt FROM licensing_installations ORDER BY id DESC"
        )
        .all(),
      licenses: this.database
        .prepare(
          "SELECT id,license_uuid AS licenseId,installation_id AS installationDatabaseId,license_type AS licenseType,status,starts_at AS startsAt,expires_at AS expiresAt,update_entitlement AS updateEntitlement FROM site_bound_licenses ORDER BY id DESC"
        )
        .all(),
      devices: this.database
        .prepare(
          "SELECT id,license_id AS licenseDatabaseId,device_id AS deviceDatabaseId,device_identity AS deviceIdentity,status,bound_at AS boundAt FROM licensed_device_bindings ORDER BY id DESC"
        )
        .all(),
      events: this.database
        .prepare(
          "SELECT id,license_id AS licenseDatabaseId,event_type AS eventType,actor_identity AS actorIdentity,occurred_at AS occurredAt FROM license_events ORDER BY id DESC LIMIT 200"
        )
        .all(),
    };
  }

  private event(
    licenseId: number,
    type: string,
    actor: string,
    at: string,
    evidence: unknown
  ): void {
    const installationId = Number(
      this.database
        .prepare("SELECT installation_id FROM site_bound_licenses WHERE id=?")
        .pluck()
        .get(licenseId)
    );
    this.database
      .prepare(
        "INSERT INTO license_events (installation_id,license_id,event_type,actor_identity,occurred_at,evidence_json) VALUES (?,?,?,?,?,?)"
      )
      .run(installationId, licenseId, type, actor, at, JSON.stringify(evidence));
  }
}

export function evaluateOfflineWindow(
  lastValidatedAt: string | null,
  graceSeconds: number,
  now = new Date()
): "VALID" | "OFFLINE_GRACE" | "RESTRICTED" {
  if (!lastValidatedAt) return "RESTRICTED";
  const elapsed = (now.getTime() - new Date(lastValidatedAt).getTime()) / 1000;
  if (elapsed <= graceSeconds) return "OFFLINE_GRACE";
  return "RESTRICTED";
}
