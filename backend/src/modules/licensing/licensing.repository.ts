import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import type { ActivationRequest } from "./licensing.schema";

export class LicensingRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  recordActivationRequest(input: ActivationRequest): number {
    return this.database.transaction(() => {
      const insertedInstallation = this.database
        .prepare(
          `INSERT INTO licensing_installations
             (installation_uuid,customer_id,site_id,status,created_at,created_by,updated_at)
             VALUES (?,?,?,?,?,?,?)
             ON CONFLICT(installation_uuid) DO UPDATE SET updated_at=excluded.updated_at
             RETURNING id`
        )
        .get(
          input.installationId,
          input.customerId,
          input.siteId,
          "PENDING",
          input.requestedAt,
          "INSTALLATION",
          input.requestedAt
        ) as { id: number };
      const installationId = Number(insertedInstallation.id);
      const scope = this.database
        .prepare("SELECT customer_id,site_id FROM licensing_installations WHERE id=?")
        .get(installationId) as { customer_id: number; site_id: number };
      if (scope.customer_id !== input.customerId || scope.site_id !== input.siteId) {
        throw new Error("Installation identity is already bound to another customer or site");
      }
      this.database
        .prepare(
          `INSERT INTO licensing_identities
           (licensing_installation_id,public_key_pem,hardware_fingerprint_json,fingerprint_schema_version,registered_at)
           VALUES (?,?,?,?,?) ON CONFLICT(licensing_installation_id) DO NOTHING`
        )
        .run(
          installationId,
          input.publicKeyPem,
          JSON.stringify(input.hardwareFingerprint),
          input.hardwareFingerprint.schemaVersion,
          input.requestedAt
        );
      const result = this.database
        .prepare(
          `INSERT INTO license_activation_requests
           (request_uuid,licensing_installation_id,status,requested_at) VALUES (?,?,'PENDING',?)`
        )
        .run(input.requestId, installationId, input.requestedAt);
      this.event(installationId, null, "ACTIVATION_REQUESTED", "INSTALLATION", input.requestedAt, {
        requestId: input.requestId,
      });
      return Number(result.lastInsertRowid);
    })();
  }

  getPendingRequest(requestUuid: string) {
    return this.database
      .prepare(
        `SELECT ar.id,ar.request_uuid AS requestId,li.id AS installationDatabaseId,
          li.installation_uuid AS installationId,li.customer_id AS customerId,li.site_id AS siteId,
          id.public_key_pem AS publicKeyPem,id.hardware_fingerprint_json AS hardwareFingerprintJson
         FROM license_activation_requests ar
         JOIN licensing_installations li ON li.id=ar.licensing_installation_id
         JOIN licensing_identities id ON id.licensing_installation_id=li.id
         WHERE ar.request_uuid=? AND ar.status='PENDING'`
      )
      .get(requestUuid) as
      | {
          id: number;
          requestId: string;
          installationDatabaseId: number;
          installationId: string;
          customerId: number;
          siteId: number;
          publicKeyPem: string;
          hardwareFingerprintJson: string;
        }
      | undefined;
  }

  approve(
    request: NonNullable<ReturnType<LicensingRepository["getPendingRequest"]>>,
    license: {
      uuid: string;
      type: string;
      startsAt: string;
      expiresAt: string | null;
      maintenanceUntil: string | null;
      updateEntitlement: string;
      offlinePolicyJson: string;
      modules: string[];
      maximumGateways: number | null;
      maximumDevices: number | null;
      maximumSensors: number | null;
    },
    certificate: { keyId: string; json: string; sha256: string; issuedAt: string },
    actor: string
  ): number {
    return this.database.transaction(() => {
      const licenseId = Number(
        this.database
          .prepare(
            `INSERT INTO site_bound_licenses
             (license_uuid,installation_id,schema_version,license_type,status,issued_at,starts_at,expires_at,maintenance_until,update_entitlement,offline_policy_json,created_at,created_by)
             VALUES (?,?,1,?,'ACTIVE',?,?,?,?,?,?,?,?)`
          )
          .run(
            license.uuid,
            request.installationDatabaseId,
            license.type,
            certificate.issuedAt,
            license.startsAt,
            license.expiresAt,
            license.maintenanceUntil,
            license.updateEntitlement,
            license.offlinePolicyJson,
            certificate.issuedAt,
            actor
          ).lastInsertRowid
      );
      const entitlement = this.database.prepare(
        `INSERT INTO license_entitlements
         (license_id,module_code,enabled,maximum_gateways,maximum_devices,maximum_sensors)
         VALUES (?,?,1,?,?,?)`
      );
      for (const moduleCode of license.modules) {
        entitlement.run(
          licenseId,
          moduleCode,
          license.maximumGateways,
          license.maximumDevices,
          license.maximumSensors
        );
      }
      this.database
        .prepare(
          `INSERT INTO signed_license_certificates
           (license_id,activation_request_id,key_id,algorithm,certificate_json,certificate_sha256,issued_at)
           VALUES (?,?,?,'Ed25519',?,?,?)`
        )
        .run(
          licenseId,
          request.id,
          certificate.keyId,
          certificate.json,
          certificate.sha256,
          certificate.issuedAt
        );
      this.database
        .prepare(
          "UPDATE license_activation_requests SET status='APPROVED',decided_at=?,decided_by=? WHERE id=?"
        )
        .run(certificate.issuedAt, actor, request.id);
      this.database
        .prepare("UPDATE licensing_installations SET status='ACTIVE',updated_at=? WHERE id=?")
        .run(certificate.issuedAt, request.installationDatabaseId);
      this.event(
        request.installationDatabaseId,
        licenseId,
        "LICENSE_ACTIVATED",
        actor,
        certificate.issuedAt,
        {
          requestId: request.requestId,
          licenseId: license.uuid,
        }
      );
      return licenseId;
    })();
  }

  private event(
    installationId: number,
    licenseId: number | null,
    type: string,
    actor: string,
    at: string,
    evidence: unknown
  ) {
    this.database
      .prepare(
        "INSERT INTO license_events (installation_id,license_id,event_type,actor_identity,occurred_at,evidence_json) VALUES (?,?,?,?,?,?)"
      )
      .run(installationId, licenseId, type, actor, at, JSON.stringify(evidence));
  }
}
